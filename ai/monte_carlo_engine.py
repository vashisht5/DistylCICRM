"""
Monte Carlo engine for pre-sales negotiation simulation.
Pure Python — no API calls. All computation driven by stakeholder profiles.

Model:
  - State: per-buyer trust scores (0-100) + round counter
  - Each round: seller picks an action (weighted by strategy), each buyer's
    trust updates via N(mean*modifier, std) based on their psychology profile
  - Composite trust = influence-weighted average across buyers
  - Win:      composite >= WIN_THRESHOLD on a close_attempt (or auto-close if very high trust late)
  - Lost:     any key_decision_maker trust < LOSS_THRESHOLD
  - Walkaway: probabilistic, triggered when composite < 30
  - Stall:    trust plateau for STALL_ROUNDS consecutive rounds at mid-game
"""
import math
import random
from typing import Optional

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


# ── Constants ─────────────────────────────────────────────────────────────────

WIN_THRESHOLD      = 68   # composite trust needed to close
KDM_WIN_MIN        = 55   # KDMs must also individually exceed this to close
LOSS_THRESHOLD     = 22   # any KDM below this → lost
MIN_CLOSE_ROUND    = 3    # earliest possible close
STALL_ROUNDS       = 3    # consecutive rounds with < 2-point delta → stall risk
DEFAULT_MAX_ROUNDS = 10

INFLUENCE_WEIGHTS = {
    'key_decision_maker': 1.00,
    'high':               0.75,
    'medium':             0.45,
    'low':                0.20,
}

# (base_mean_delta, base_std) for each seller action type
# Calibrated so a good 8-round negotiation with mixed committee yields ~50-60% win rate
ACTION_EFFECTS = {
    'value_anchor':      ( 5.0, 3.5),
    'concession':        ( 4.5, 2.5),
    'reference_proof':   ( 4.5, 3.0),
    'exec_alignment':    ( 6.0, 4.0),
    'technical_demo':    ( 3.5, 2.5),
    'information_share': ( 2.5, 2.0),
    'price_reduction':   ( 3.0, 3.5),
    'urgency':           (-2.0, 6.0),   # high variance — can help or hurt
    'push_back':         (-3.0, 7.0),   # risky, occasionally builds respect
    'close_attempt':     ( 0.0, 4.0),   # delta near zero; outcome gated by trust
}

# strategy keyword → action probability weights
STRATEGY_WEIGHTS = {
    'value':        {'value_anchor': 3, 'reference_proof': 3, 'exec_alignment': 2,
                     'information_share': 2, 'concession': 1, 'close_attempt': 1},
    'aggressive':   {'urgency': 3, 'close_attempt': 3, 'price_reduction': 2,
                     'push_back': 2, 'concession': 1, 'value_anchor': 1},
    'relationship': {'exec_alignment': 4, 'information_share': 3, 'reference_proof': 2,
                     'concession': 2, 'value_anchor': 1, 'close_attempt': 1},
    'technical':    {'technical_demo': 4, 'information_share': 3, 'value_anchor': 2,
                     'reference_proof': 2, 'close_attempt': 1},
    'default':      {'value_anchor': 2, 'concession': 2, 'reference_proof': 2,
                     'exec_alignment': 2, 'information_share': 1, 'close_attempt': 1},
}

# Psychology profile → action multipliers (how much this buyer type responds to each move)
DECISION_STYLE_MODS = {
    'analytical':  {'value_anchor': 1.40, 'technical_demo': 1.30, 'reference_proof': 1.25,
                    'urgency': 0.35, 'push_back': 0.75},
    'intuitive':   {'exec_alignment': 1.30, 'urgency': 1.25, 'value_anchor': 0.85,
                    'technical_demo': 0.70},
    'consensus':   {'reference_proof': 1.40, 'exec_alignment': 1.35, 'push_back': 0.55,
                    'information_share': 1.20},
    'directive':   {'push_back': 1.50, 'close_attempt': 1.25, 'urgency': 0.55,
                    'information_share': 0.70},
    'relational':  {'exec_alignment': 1.50, 'information_share': 1.45, 'urgency': 0.25,
                    'technical_demo': 0.75},
}

RISK_MODS = {
    'risk_averse':   {'concession': 1.35, 'reference_proof': 1.20, 'urgency': 0.15,
                      'push_back': 0.50, 'price_reduction': 0.80},
    'moderate':      {},
    'risk_tolerant': {'urgency': 1.45, 'close_attempt': 1.30, 'push_back': 1.25,
                      'concession': 0.75},
}

EGO_MODS = {
    'low':    {},
    'medium': {'push_back': 1.10, 'urgency': 0.90},
    'high':   {'push_back': 1.90, 'urgency': 0.25, 'exec_alignment': 1.35,
               'information_share': 0.65, 'concession': 1.10},
}

CONCESSION_PATTERN_MODS = {
    'never_first':    {'concession': 0.50},
    'reciprocal':     {'concession': 1.50},
    'strategic_early':{'concession': 1.80},
    'random':         {},
}

# Per-round probability of random market/deal events
EVENT_PROBS = {
    'competitor_enters':  0.07,   # -10 to -15 trust all buyers
    'budget_concern':     0.06,   # -5 trust all buyers
    'champion_boost':     0.10,   # +5 non-champion trust (if champion trust > 60)
    'exec_pressure':      0.05,   # -8 trust (if high-ego KDM present)
    'external_deadline':  0.03,   # small trust boost — urgency now works in seller's favour
}


# ── RNG helpers ────────────────────────────────────────────────────────────────

def _normal(mean: float, std: float, rng) -> float:
    if HAS_NUMPY:
        return float(rng.normal(mean, std))
    u1 = max(random.random(), 1e-10)
    u2 = random.random()
    z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
    return mean + std * z


def _uniform(rng) -> float:
    return float(rng.random()) if HAS_NUMPY else random.random()


def _weighted_choice(weights: dict, rng) -> str:
    keys = list(weights.keys())
    total = sum(weights.values())
    probs = [weights[k] / total for k in keys]
    if HAS_NUMPY:
        return keys[int(rng.choice(len(keys), p=probs))]
    r, cum = _uniform(rng), 0.0
    for k, p in zip(keys, probs):
        cum += p
        if r <= cum:
            return k
    return keys[-1]


# ── Profile helpers ────────────────────────────────────────────────────────────

def _parse_strategy(strategy_str: str) -> dict:
    s = (strategy_str or '').lower()
    if any(w in s for w in ['value', 'roi', 'savings', 'business case', 'justify']):
        return STRATEGY_WEIGHTS['value']
    if any(w in s for w in ['aggressive', 'urgent', 'pressure', 'close fast', 'fast']):
        return STRATEGY_WEIGHTS['aggressive']
    if any(w in s for w in ['relationship', 'trust', 'exec', 'champion', 'partner']):
        return STRATEGY_WEIGHTS['relationship']
    if any(w in s for w in ['technical', 'demo', 'poc', 'proof', 'integration']):
        return STRATEGY_WEIGHTS['technical']
    return STRATEGY_WEIGHTS['default']


def _buyer_delta(buyer: dict, action: str, round_num: int, rng) -> float:
    base_mean, base_std = ACTION_EFFECTS.get(action, (3.0, 3.0))
    mods = [
        DECISION_STYLE_MODS.get(buyer.get('decision_style', ''), {}).get(action, 1.0),
        RISK_MODS.get(buyer.get('risk_tolerance', ''), {}).get(action, 1.0),
        EGO_MODS.get(buyer.get('ego_level', ''), {}).get(action, 1.0),
        CONCESSION_PATTERN_MODS.get(buyer.get('concession_pattern', ''), {}).get(action, 1.0),
    ]
    multiplier = 1.0
    for m in mods:
        multiplier *= m
    # strategic_early concessions diminish after round 2
    if buyer.get('concession_pattern') == 'strategic_early' and action == 'concession' and round_num > 2:
        multiplier *= max(0.3, 1.0 - (round_num - 2) * 0.15)
    return _normal(base_mean * multiplier, base_std, rng)


def _composite(trust: list, buyers: list) -> float:
    tw = sum(INFLUENCE_WEIGHTS.get(b.get('influence_level', 'medium'), 0.45) for b in buyers)
    if tw == 0:
        return 50.0
    return sum(
        trust[i] * INFLUENCE_WEIGHTS.get(buyers[i].get('influence_level', 'medium'), 0.45)
        for i in range(len(buyers))
    ) / tw


# ── Single simulation run ──────────────────────────────────────────────────────

def _resolve_config(config: dict) -> dict:
    """Merge user-supplied config overrides with module defaults."""
    ep = {**EVENT_PROBS}
    if 'event_probs' in config:
        for k, v in config['event_probs'].items():
            if k in ep:
                ep[k] = max(0.0, min(0.50, float(v)))
    # Zero out disabled events
    for k in list(ep.keys()):
        if config.get(f'event_{k}_enabled') is False:
            ep[k] = 0.0
    return {
        'win_threshold':   float(config.get('win_threshold',   WIN_THRESHOLD)),
        'kdm_win_min':     float(config.get('kdm_win_min',     KDM_WIN_MIN)),
        'loss_threshold':  float(config.get('loss_threshold',  LOSS_THRESHOLD)),
        'min_close_round': int(config.get('min_close_round',   MIN_CLOSE_ROUND)),
        'event_probs':     ep,
        # optional custom action weights (takes precedence over strategy string)
        'action_weights':  config.get('action_weights'),
    }


def _run_one(buyers: list, action_weights: dict, init_trust: list,
             max_rounds: int, has_champion: bool, rng, cfg: dict) -> dict:
    trust = [float(t) for t in init_trust]
    concessions = 0
    stall_ctr = 0
    prev_comp = _composite(trust, buyers)
    ep = cfg['event_probs']
    win_thr   = cfg['win_threshold']
    kdm_min   = cfg['kdm_win_min']
    loss_thr  = cfg['loss_threshold']
    min_close = cfg['min_close_round']

    for rnd in range(1, max_rounds + 1):
        action = _weighted_choice(action_weights, rng)
        if action == 'concession':
            concessions += 1

        for i, b in enumerate(buyers):
            trust[i] = max(0.0, min(100.0, trust[i] + _buyer_delta(b, action, rnd, rng)))

        # Random deal events
        ev = _uniform(rng)
        p_comp = ep['competitor_enters']
        p_budget = p_comp + ep['budget_concern']
        p_champ  = p_budget + ep['champion_boost']
        if ev < p_comp:
            for i in range(len(trust)):
                trust[i] = max(0.0, trust[i] - _normal(11, 3, rng))
        elif ev < p_budget:
            for i in range(len(trust)):
                trust[i] = max(0.0, trust[i] - _normal(5, 2, rng))
        elif ev < p_champ and has_champion:
            champ_t = max((trust[i] for i, b in enumerate(buyers) if b.get('role') == 'champion'), default=50)
            if champ_t > 60:
                for i, b in enumerate(buyers):
                    if b.get('role') != 'champion':
                        trust[i] = min(100.0, trust[i] + _normal(5, 2, rng))
        elif ev < p_champ + ep.get('exec_pressure', 0.05):
            if any(b.get('ego_level') == 'high' for b in buyers):
                for i in range(len(trust)):
                    trust[i] = max(0.0, trust[i] - _normal(8, 3, rng))

        comp = _composite(trust, buyers)

        for i, b in enumerate(buyers):
            if b.get('influence_level') == 'key_decision_maker' and trust[i] < loss_thr:
                return {'outcome': 'lost', 'rounds': rnd, 'final_trust': comp, 'concessions': concessions}

        if comp < 30 and _uniform(rng) < (30 - comp) / 100.0:
            return {'outcome': 'walkaway', 'rounds': rnd, 'final_trust': comp, 'concessions': concessions}

        kdm_ready = all(
            trust[i] >= kdm_min
            for i, b in enumerate(buyers)
            if b.get('influence_level') == 'key_decision_maker'
        )
        if action == 'close_attempt' and comp >= win_thr and kdm_ready and rnd >= min_close:
            return {'outcome': 'won', 'rounds': rnd, 'final_trust': comp, 'concessions': concessions}

        if comp >= 88 and kdm_ready and rnd >= min_close and _uniform(rng) < 0.40:
            return {'outcome': 'won', 'rounds': rnd, 'final_trust': comp, 'concessions': concessions}

        stall_ctr = stall_ctr + 1 if abs(comp - prev_comp) < 2.0 else 0
        prev_comp = comp
        if stall_ctr >= STALL_ROUNDS and rnd >= 5 and _uniform(rng) < 0.50:
            return {'outcome': 'stalled', 'rounds': rnd, 'final_trust': comp, 'concessions': concessions}

    comp = _composite(trust, buyers)
    outcome = 'won' if comp >= win_thr else ('lost' if comp < 40 else 'stalled')
    return {'outcome': outcome, 'rounds': max_rounds, 'final_trust': comp, 'concessions': concessions}


# ── Public API ─────────────────────────────────────────────────────────────────

def run_monte_carlo(game_setup: dict, participants: list, n_runs: int = 500,
                    seller_strategy: str = '',
                    initial_trust_override: Optional[dict] = None,
                    seed: Optional[int] = None,
                    config: Optional[dict] = None) -> dict:
    """
    Run N Monte Carlo simulations of a pre-sales negotiation.

    game_setup:            wargame dict (presales_stage, max_rounds, deal_context, ...)
    participants:          list of participant dicts with embedded 'profile'
    n_runs:                number of independent simulations (500 is a good default)
    seller_strategy:       free-text strategy string → mapped to action weights
    initial_trust_override:{participant_id: trust_score} — seed from a path checkpoint
    seed:                  RNG seed for reproducibility (None = random)
    """
    if HAS_NUMPY:
        rng = np.random.default_rng(seed)
    else:
        if seed is not None:
            random.seed(seed)
        rng = None

    buyers = []
    for p in participants:
        if p.get('team') != 'buyer':
            continue
        profile = p.get('profile') or {}
        init_t = float(
            initial_trust_override.get(p['id'], p.get('current_trust_score', 50))
            if initial_trust_override else p.get('current_trust_score', 50)
        )
        buyers.append({
            'id':                p.get('id'),
            'name':              profile.get('name') or 'Buyer',
            'role':              profile.get('role', 'user_buyer'),
            'decision_style':    profile.get('decision_style', 'analytical'),
            'risk_tolerance':    profile.get('risk_tolerance', 'moderate'),
            'ego_level':         profile.get('ego_level', 'medium'),
            'concession_pattern':profile.get('concession_pattern', 'reciprocal'),
            'influence_level':   profile.get('influence_level', 'medium'),
            'initial_trust':     init_t,
        })

    if not buyers:
        buyers = [{'id': 0, 'name': 'Buyer', 'role': 'user_buyer', 'decision_style': 'analytical',
                   'risk_tolerance': 'moderate', 'ego_level': 'medium',
                   'concession_pattern': 'reciprocal', 'influence_level': 'medium', 'initial_trust': 50.0}]

    cfg = _resolve_config(config or {})
    # Config can override action weights directly
    if cfg['action_weights']:
        action_weights = {k: float(v) for k, v in cfg['action_weights'].items() if float(v) > 0}
    else:
        action_weights = _parse_strategy(seller_strategy or game_setup.get('seller_strategy', ''))
    max_rounds = int(game_setup.get('max_rounds', DEFAULT_MAX_ROUNDS))
    has_champion = any(b.get('role') == 'champion' for b in buyers)
    init_trust = [b['initial_trust'] for b in buyers]

    outcomes = {'won': 0, 'lost': 0, 'stalled': 0, 'walkaway': 0}
    rounds_won, all_trusts, all_concessions = [], [], []

    for _ in range(n_runs):
        r = _run_one(buyers, action_weights, init_trust, max_rounds, has_champion, rng, cfg)
        outcomes[r['outcome']] += 1
        if r['outcome'] == 'won':
            rounds_won.append(r['rounds'])
        all_trusts.append(r['final_trust'])
        all_concessions.append(r['concessions'])

    win_rate = outcomes['won'] / n_runs
    avg_rounds = sum(rounds_won) / len(rounds_won) if rounds_won else float(max_rounds)
    avg_concessions = sum(all_concessions) / (n_runs * max_rounds) if n_runs else 0.1

    # 95% Wilson confidence interval (better than normal approx at extreme win rates)
    z = 1.96
    z2 = z * z
    p_hat = win_rate
    denom = 1 + z2 / n_runs
    centre = (p_hat + z2 / (2 * n_runs)) / denom
    half = z / denom * math.sqrt(p_hat * (1 - p_hat) / n_runs + z2 / (4 * n_runs * n_runs))
    ci_low = round(max(0.0, centre - half), 3)
    ci_high = round(min(1.0, centre + half), 3)

    sorted_t = sorted(all_trusts)
    n = len(sorted_t)

    # Risk factors derived from profile analysis
    risk_factors = _risk_factors(buyers, outcomes, n_runs, win_rate)
    success_patterns = _success_patterns(buyers, action_weights)
    scenario_breakdown = _scenario_breakdown(buyers, game_setup, win_rate)

    return {
        'total_runs':          n_runs,
        'outcomes':            outcomes,
        'win_rate':            round(win_rate, 3),
        'avg_rounds_to_close': round(avg_rounds, 1),
        'avg_discount_needed': round(min(avg_concessions * 3, 0.30), 2),
        'confidence_interval': {'low': ci_low, 'high': ci_high},
        'final_trust_p25':     round(sorted_t[int(0.25 * n)], 1),
        'final_trust_median':  round(sorted_t[n // 2], 1),
        'final_trust_p75':     round(sorted_t[int(0.75 * n)], 1),
        'risk_factors':        risk_factors,
        'success_patterns':    success_patterns,
        'scenario_breakdown':  scenario_breakdown,
        'engine':              'native_mc',
    }


def run_path_monte_carlo(path_context: dict, deal_context: dict,
                         participants: list, from_round: int,
                         n_runs: int = 500, seed: Optional[int] = None,
                         config: Optional[dict] = None) -> dict:
    """
    Run Monte Carlo continuation from a specific round within a simulation path.
    Uses path's deal_state_evolution to initialise trust at the chosen checkpoint.
    """
    # Find composite trust at from_round from the path's state evolution
    evolution = path_context.get('deal_state_evolution') or []
    state = next(
        (s for s in reversed(evolution) if s.get('round', 999) <= from_round),
        None
    )
    composite_at_round = float(state['trust_score']) if state and 'trust_score' in state else 55.0

    # Scale each participant's initial trust proportionally from composite
    init_override = {}
    buyer_participants = [p for p in participants if p.get('team') == 'buyer']
    if buyer_participants:
        base_composite = sum(
            float(p.get('current_trust_score', 50)) *
            INFLUENCE_WEIGHTS.get((p.get('profile') or {}).get('influence_level', 'medium'), 0.45)
            for p in buyer_participants
        ) / sum(
            INFLUENCE_WEIGHTS.get((p.get('profile') or {}).get('influence_level', 'medium'), 0.45)
            for p in buyer_participants
        )
        scale = composite_at_round / base_composite if base_composite > 0 else 1.0
        for p in buyer_participants:
            init_override[p['id']] = max(5.0, min(95.0, float(p.get('current_trust_score', 50)) * scale))

    remaining_rounds = max(3, int(deal_context.get('max_rounds', DEFAULT_MAX_ROUNDS)) - from_round)
    game_setup = {**deal_context, 'max_rounds': remaining_rounds}

    result = run_monte_carlo(
        game_setup=game_setup,
        participants=participants,
        n_runs=n_runs,
        seller_strategy=path_context.get('seller_strategy', ''),
        initial_trust_override=init_override,
        seed=seed,
        config=config,
    )
    result['from_round'] = from_round
    result['composite_trust_at_checkpoint'] = round(composite_at_round, 1)

    # Recommended next move based on current state
    result['recommended_next_move'] = _recommend_next(
        composite_at_round, path_context.get('seller_strategy', ''), buyer_participants
    )
    return result


# ── Narrative helpers ──────────────────────────────────────────────────────────

def _risk_factors(buyers, outcomes, n_runs, win_rate):
    risks = []
    for b in buyers:
        if b.get('influence_level') == 'key_decision_maker' and b.get('risk_tolerance') == 'risk_averse':
            risks.append(f"{b['name']} (KDM + risk-averse) is a single point of failure")
        if b.get('ego_level') == 'high' and b.get('decision_style') == 'directive':
            risks.append(f"{b['name']}'s directive/high-ego style makes pushback tactics dangerous")
    stall_rate = outcomes.get('stalled', 0) / max(n_runs, 1)
    if stall_rate > 0.30:
        risks.append(f"High stall rate ({round(stall_rate*100)}%) — deal lacks urgency or trust momentum")
    if win_rate < 0.40:
        risks.append("Base win probability below 40% — fundamental alignment gaps present")
    return risks[:4]


def _success_patterns(buyers, action_weights):
    patterns = []
    top = sorted(action_weights.items(), key=lambda x: x[1], reverse=True)[:3]
    labels = {
        'exec_alignment':    'Executive alignment accelerates trust across the buying committee',
        'value_anchor':      'Hard-dollar ROI anchoring moves analytical buyers forward',
        'reference_proof':   'Customer references reduce risk-averse objections effectively',
        'concession':        'Strategic concessions unlock reciprocal buyer movement',
        'information_share': 'Proactive information sharing builds relational trust',
        'technical_demo':    'Live proof-of-concept addresses technical evaluation concerns',
    }
    for action, _ in top:
        if action in labels:
            patterns.append(labels[action])
    if any(b.get('role') == 'champion' for b in buyers):
        patterns.append('Active champion — leverage them for internal mobilisation')
    return patterns[:4]


def _scenario_breakdown(buyers, game_setup, base_win_rate):
    # Estimate win rates for named scenarios based on profile traits
    stage = game_setup.get('presales_stage', 'negotiation')
    breakdown = [
        {'scenario': 'Champion-led close',
         'win_rate': round(min(0.95, base_win_rate * 1.35), 2),
         'description': 'Champion actively mobilises; minimal procurement friction'},
    ]
    if any(b.get('risk_tolerance') == 'risk_averse' for b in buyers):
        breakdown.append({
            'scenario': 'Risk-averse committee',
            'win_rate': round(max(0.05, base_win_rate * 0.65), 2),
            'description': 'Conservative buyers demand extensive proof before committing',
        })
    if stage in ('negotiation', 'pricing'):
        breakdown.append({
            'scenario': 'Procurement-led price war',
            'win_rate': round(max(0.05, base_win_rate * 0.55), 2),
            'description': 'Procurement commoditises and extracts maximum discount',
        })
    if any(b.get('ego_level') == 'high' for b in buyers):
        breakdown.append({
            'scenario': 'Exec escalation',
            'win_rate': round(max(0.05, base_win_rate * 0.75), 2),
            'description': 'High-ego executive intervenes; deal resets at senior level',
        })
    return breakdown


def _recommend_next(composite_trust, seller_strategy, buyer_participants):
    strategy = (seller_strategy or '').lower()
    if composite_trust >= 68:
        return "Trust is above close threshold — attempt a close with clear next-step commitment."
    if composite_trust >= 55:
        return "Trust is building — one strong exec-alignment or reference move should push past close threshold."
    if composite_trust >= 40:
        if any((p.get('profile') or {}).get('risk_tolerance') == 'risk_averse' for p in buyer_participants):
            return "Risk-averse buyers present — prioritise reference proof and concession over urgency tactics."
        return "Mid-range trust — use value anchoring or a strategic concession to accelerate momentum."
    return "Trust is low — avoid urgency and push-back tactics; focus on rebuilding with information sharing and exec alignment."
