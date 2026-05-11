"""
WargameAgent — AI-driven pre-sales simulation.
Plays buyer stakeholders, adjudicates turns, runs Monte Carlo.
"""
import json
from ai.base_agent import BaseIntelAgent


class WargameAgent(BaseIntelAgent):

    # Stage-specific behavioral modifiers
    STAGE_PROMPTS = {
        'discovery': 'You are in DISCOVERY stage. Be curious and exploratory. Ask probing questions. Share some pain points but guard details. Avoid commitment.',
        'qualification': 'You are in QUALIFICATION stage. Probe for fit and budget. Be somewhat guarded about authority. Push seller to justify value.',
        'technical_eval': 'You are in TECHNICAL EVALUATION stage. Ask detailed technical questions. Raise integration concerns. Demand proof of capability.',
        'pricing': 'You are in PRICING stage. Anchor low. Challenge line items. Demand discounts. Compare to competitors.',
        'negotiation': 'You are in NEGOTIATION stage. Be positional and guarded. Use tactics. Make concessions only when matched. Test seller resolve.',
        'close': 'You are in CLOSING stage. May have last-minute concerns. Could escalate. May ask for final concessions before signing.',
    }

    def generate_ai_persona(self, role: str, deal_context: dict, presales_stage: str) -> dict:
        """Generate an AI persona description for a wargame participant."""
        stage_note = self.STAGE_PROMPTS.get(presales_stage, self.STAGE_PROMPTS['negotiation'])
        prompt = f"""Create a buyer persona for a wargame simulation.

Role: {role}
Deal Context: {json.dumps(deal_context or {}, indent=2)}
Stage: {presales_stage}
Stage Behavior: {stage_note}

Return a JSON object:
{{
  "persona_summary": "2-3 sentence description of this buyer persona",
  "opening_position": "their opening position/stance in this negotiation",
  "primary_objective": "what they most want from this deal",
  "key_concerns": ["list of 3-5 key concerns"],
  "tactics_to_use": ["list of 2-3 negotiation tactics they'll use"],
  "dealbreakers": ["list of 1-3 things that would make them walk away"]
}}

Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=1000)
        if err or not text:
            return {"persona_summary": f"AI {role} buyer", "opening_position": "Evaluating options",
                    "primary_objective": "Best value", "key_concerns": [], "tactics_to_use": [], "dealbreakers": []}
        try:
            return self._extract_json(text)
        except Exception:
            return {"persona_summary": f"AI {role} buyer", "opening_position": "Evaluating options",
                    "primary_objective": "Best value", "key_concerns": [], "tactics_to_use": [], "dealbreakers": []}

    def play_turn(self, participant: dict, profile: dict, deal_state: dict,
                  turn_history: list, user_move: dict, stage: str) -> dict:
        """Generate AI buyer response to user's move."""
        stage_note = self.STAGE_PROMPTS.get(stage, self.STAGE_PROMPTS['negotiation'])

        profile_summary = ""
        if profile:
            profile_summary = f"""
Psychological Profile:
- Decision Style: {profile.get('decision_style', 'unknown')}
- Risk Tolerance: {profile.get('risk_tolerance', 'unknown')}
- Ego Level: {profile.get('ego_level', 'unknown')}
- Primary Motivation: {profile.get('primary_motivation', 'unknown')}
- Communication Style: {profile.get('communication_style', 'unknown')}
- Hot Buttons: {profile.get('hot_buttons', [])}
- Known Tactics: {profile.get('known_tactics', [])}
- Concession Pattern: {profile.get('concession_pattern', 'reciprocal')}
- Typical Objectives: {profile.get('typical_objectives', [])}
- Typical Constraints: {profile.get('typical_constraints', [])}
"""

        history_text = ""
        if turn_history:
            recent = turn_history[-6:]  # Last 6 turns for context
            history_text = "\n".join([f"Round {t.get('round_number', '?')} [{t.get('actor_label', '?')}]: {json.dumps(t.get('content', {}))}" for t in recent])

        prompt = f"""You are playing the role of a buyer in a pre-sales negotiation wargame.

YOUR IDENTITY:
- Name: {participant.get('opening_notes', 'AI Buyer')}
- Team: Buyer
- Trust Score: {participant.get('current_trust_score', 50)}/100
{profile_summary}

STAGE: {stage}
{stage_note}

DEAL STATE:
{json.dumps(deal_state or {}, indent=2)}

RECENT TURN HISTORY:
{history_text or 'No history yet - this is round 1.'}

SELLER'S LATEST MOVE:
{json.dumps(user_move or {}, indent=2)}

Respond as this buyer persona. Be realistic and consistent with the psychological profile.

Return a JSON object:
{{
  "action_type": one of [counter_offer, concession, escalation, information_request, walkaway_signal, close],
  "content": {{"message": "what you say", "terms_proposed": {{}}, "questions": []}},
  "reasoning": "internal reasoning (not shown to seller) - why you're responding this way",
  "trust_delta": integer -20 to +20,
  "engagement_level": one of [disengaged, low, moderate, high, very_high],
  "deal_state_delta": {{"field": "change"}}
}}

Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=1500)
        if err or not text:
            return {
                "action_type": "information_request",
                "content": {"message": "Can you clarify your proposal further?", "terms_proposed": {}, "questions": []},
                "reasoning": "Seeking more information",
                "trust_delta": 0,
                "engagement_level": "moderate",
                "deal_state_delta": {}
            }
        try:
            return self._extract_json(text)
        except Exception:
            return {
                "action_type": "information_request",
                "content": {"message": "Can you clarify your proposal further?", "terms_proposed": {}, "questions": []},
                "reasoning": "Seeking more information",
                "trust_delta": 0,
                "engagement_level": "moderate",
                "deal_state_delta": {}
            }

    def play_seller_turn(self, strategy: str, deal_state: dict,
                         turn_history: list, buyer_moves: list, stage: str) -> dict:
        """Auto-run: AI plays seller following stated strategy."""
        history_text = ""
        if turn_history:
            recent = turn_history[-4:]
            history_text = "\n".join([f"[{t.get('actor_label', '?')}]: {json.dumps(t.get('content', {}))}" for t in recent])

        prompt = f"""You are playing the seller role in a pre-sales wargame simulation.

STRATEGY: {strategy or 'Win at best available terms, maintain relationship'}

STAGE: {stage}

DEAL STATE:
{json.dumps(deal_state or {}, indent=2)}

RECENT HISTORY:
{history_text or 'Round 1 - opening move.'}

BUYER'S LATEST MOVES:
{json.dumps(buyer_moves or [], indent=2)}

Respond as a skilled seller. Make a strategic move.

Return JSON:
{{
  "action_type": one of [offer, counter_offer, concession, information_request, close],
  "content": {{"message": "what you say", "terms_proposed": {{}}}},
  "reasoning": "your strategic reasoning",
  "deal_state_delta": {{"field": "change"}}
}}

Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=1200)
        if err or not text:
            return {
                "action_type": "offer",
                "content": {"message": "Here is our proposal based on your needs.", "terms_proposed": {}},
                "reasoning": "Advancing toward close",
                "deal_state_delta": {}
            }
        try:
            return self._extract_json(text)
        except Exception:
            return {
                "action_type": "offer",
                "content": {"message": "Here is our proposal based on your needs.", "terms_proposed": {}},
                "reasoning": "Advancing toward close",
                "deal_state_delta": {}
            }

    def adjudicate(self, user_move: dict, ai_responses: list, deal_state: dict,
                   participants: list, stage: str) -> dict:
        """Adjudicate a round — determine deal state changes and outcome signals."""
        prompt = f"""You are the impartial adjudicator of a sales negotiation simulation.

STAGE: {stage}

DEAL STATE BEFORE THIS ROUND:
{json.dumps(deal_state or {}, indent=2)}

SELLER'S MOVE:
{json.dumps(user_move or {}, indent=2)}

BUYER RESPONSES:
{json.dumps(ai_responses or [], indent=2)}

PARTICIPANTS:
{json.dumps(participants or [], indent=2)}

Adjudicate this round. Assess progress toward deal close.

Return JSON:
{{
  "summary": "1-2 sentence neutral summary of what happened this round",
  "deal_momentum": one of [advancing, stalled, regressing, critical],
  "win_probability_delta": integer -30 to +30,
  "deal_state_updates": {{}},
  "red_flags": ["any concerning signals"],
  "coaching_tips": ["1-2 tips for the seller"],
  "outcome_signal": one of [none, close_possible, walkaway_risk, needs_escalation]
}}

Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=1000)
        if err or not text:
            return {
                "summary": "Round completed.",
                "deal_momentum": "stalled",
                "win_probability_delta": 0,
                "deal_state_updates": {},
                "red_flags": [],
                "coaching_tips": [],
                "outcome_signal": "none"
            }
        try:
            return self._extract_json(text)
        except Exception:
            return {
                "summary": "Round completed.",
                "deal_momentum": "stalled",
                "win_probability_delta": 0,
                "deal_state_updates": {},
                "red_flags": [],
                "coaching_tips": [],
                "outcome_signal": "none"
            }

    def analyze_game(self, wargame: dict, turns: list, participants: list, profiles: list) -> dict:
        """Generate post-game analysis."""
        prompt = f"""Analyze this completed pre-sales wargame simulation.

WARGAME:
{json.dumps(wargame, indent=2)}

PARTICIPANTS:
{json.dumps(participants, indent=2)}

TURN HISTORY (last 20):
{json.dumps(turns[-20:] if len(turns) > 20 else turns, indent=2)}

Provide comprehensive post-game analysis.

Return JSON:
{{
  "executive_summary": "2-3 sentence summary of how the game played out",
  "outcome": one of [won, lost, stalled, walkaway],
  "win_probability_final": integer 0-100,
  "key_turning_points": ["list of 2-3 pivotal moments"],
  "seller_strengths": ["what the seller did well"],
  "seller_weaknesses": ["areas for improvement"],
  "buyer_leverage_points": ["what the buyer used effectively"],
  "recommended_strategies": ["3-5 actionable recommendations"],
  "pattern_analysis": "recurring patterns observed",
  "confidence": "high|medium|low"
}}

Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=2000)
        if err or not text:
            return {"executive_summary": "Analysis unavailable.", "outcome": "stalled",
                    "win_probability_final": 50, "key_turning_points": [], "seller_strengths": [],
                    "seller_weaknesses": [], "buyer_leverage_points": [],
                    "recommended_strategies": [], "pattern_analysis": "", "confidence": "low"}
        try:
            return self._extract_json(text)
        except Exception:
            return {"executive_summary": "Analysis unavailable.", "outcome": "stalled",
                    "win_probability_final": 50, "key_turning_points": [], "seller_strengths": [],
                    "seller_weaknesses": [], "buyer_leverage_points": [],
                    "recommended_strategies": [], "pattern_analysis": "", "confidence": "low"}

    def run_single_simulation(self, game_setup: dict, profiles: list) -> dict:
        """Run a single complete simulation autonomously."""
        prompt = f"""Run a complete pre-sales negotiation simulation.

GAME SETUP:
{json.dumps(game_setup, indent=2)}

BUYER PROFILES:
{json.dumps(profiles, indent=2)}

Simulate a realistic negotiation from start to finish in 5-8 rounds.

Return JSON:
{{
  "outcome": one of [won, lost, stalled, walkaway],
  "rounds_played": integer,
  "win_probability": integer 0-100,
  "summary": "2-3 sentence summary",
  "key_events": ["list of key events"],
  "final_deal_terms": {{}}
}}

Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=1500)
        if err or not text:
            return {"outcome": "stalled", "rounds_played": 5, "win_probability": 50,
                    "summary": "Simulation incomplete.", "key_events": [], "final_deal_terms": {}}
        try:
            return self._extract_json(text)
        except Exception:
            return {"outcome": "stalled", "rounds_played": 5, "win_probability": 50,
                    "summary": "Simulation incomplete.", "key_events": [], "final_deal_terms": {}}

    _PATH_ARCHETYPES = [
        ("Cooperative Champion", "Value-based close", "Champion is influential and aligned — builds trust fast, drives deal forward"),
        ("Procurement Blockade", "Justify every line item", "Procurement takes over, commoditizes, triggers price war"),
        ("Competitive Threat", "Differentiate aggressively", "Competitor enters mid-deal — buyer uses as leverage for concessions"),
        ("Budget Freeze / Exec Escalation", "Exec-level ROI case", "Executive intervenes, budget questioned, deal stalls then recovers"),
        ("Champion Goes Cold", "Re-qualify and find new champion", "Original champion disengages — seller must rebuild internally"),
        ("Accelerated Close", "Urgency + scarcity", "Buyer has external deadline — deal compresses to 2-3 rounds"),
    ]

    def simulate_paths(self, game_setup: dict, profiles: list, n_paths: int = 4) -> list:
        """
        Generate N simulation paths — one Claude call per path so each gets full token budget.
        Returns full turn-by-turn narratives for each path.
        """
        archetypes = self._PATH_ARCHETYPES[:n_paths]
        paths = []
        for i, (label, seller_strategy, buyer_stance) in enumerate(archetypes):
            path = self._generate_single_path(
                path_id=i + 1,
                label=label,
                seller_strategy=seller_strategy,
                buyer_stance=buyer_stance,
                game_setup=game_setup,
                profiles=profiles,
            )
            paths.append(path)
        return paths

    def _generate_single_path(self, path_id: int, label: str, seller_strategy: str,
                               buyer_stance: str, game_setup: dict, profiles: list) -> dict:
        """Generate one complete simulation path with full turn-by-turn dialogue."""
        stage = game_setup.get('presales_stage', 'negotiation')
        stage_note = self.STAGE_PROMPTS.get(stage, self.STAGE_PROMPTS['negotiation'])

        profile_summaries = [{
            'name': p.get('name'), 'role': p.get('role'),
            'decision_style': p.get('decision_style'),
            'risk_tolerance': p.get('risk_tolerance'),
            'ego_level': p.get('ego_level'),
            'hot_buttons': p.get('hot_buttons', []),
            'known_tactics': p.get('known_tactics', []),
            'concession_pattern': p.get('concession_pattern'),
            'primary_motivation': p.get('primary_motivation'),
        } for p in profiles]

        prompt = f"""Simulate a complete pre-sales negotiation path for a seller coaching tool.

PATH ARCHETYPE: {label}
SELLER STRATEGY: {seller_strategy}
BUYER STANCE: {buyer_stance}

DEAL CONTEXT:
{json.dumps(game_setup.get('deal_context', game_setup), indent=2)}

STAGE: {stage}
{stage_note}

BUYER PROFILES:
{json.dumps(profile_summaries, indent=2)}

Generate exactly 6 rounds of negotiation. Each round has: seller move → each buyer response → adjudicator summary.
Make the dialogue specific to this deal, realistic, and shaped by the archetype above.

Return a single JSON object:
{{
  "path_id": {path_id},
  "label": "{label}",
  "seller_strategy": "{seller_strategy}",
  "buyer_stance": "{buyer_stance}",
  "scenario_twist": "one unexpected event that shapes this path, or null",
  "outcome": "won" | "lost" | "stalled" | "walkaway",
  "win_probability": integer 0-100,
  "rounds_played": 6,
  "summary": "2-3 sentence narrative of how this path unfolded",
  "key_moments": [
    {{"round": 2, "impact": "positive" | "negative" | "neutral", "description": "what happened and why it mattered"}},
    {{"round": 4, "impact": "positive" | "negative" | "neutral", "description": "..."}},
    {{"round": 6, "impact": "positive" | "negative" | "neutral", "description": "..."}}
  ],
  "turns": [
    {{
      "round": 1,
      "actor": "Seller",
      "action_type": "offer",
      "message": "Realistic 2-3 sentence dialogue",
      "internal_reasoning": "Why this move"
    }},
    {{
      "round": 1,
      "actor": "[Buyer name from profiles]",
      "action_type": "counter_offer",
      "message": "Realistic buyer response",
      "trust_delta": integer -15 to +15,
      "internal_reasoning": "Buyer internal state"
    }},
    {{
      "round": 1,
      "actor": "Adjudicator",
      "action_type": "adjudication",
      "message": "Neutral 1-sentence round summary",
      "deal_momentum": "advancing" | "stalled" | "regressing" | "critical",
      "coaching_tip": "1 actionable tip for the seller"
    }}
  ],
  "deal_state_evolution": [
    {{"round": 1, "trust_score": 50, "win_probability": 45, "momentum": "advancing"}},
    {{"round": 2, "trust_score": 55, "win_probability": 50, "momentum": "advancing"}},
    {{"round": 3, "trust_score": 45, "win_probability": 40, "momentum": "stalled"}},
    {{"round": 4, "trust_score": 60, "win_probability": 58, "momentum": "advancing"}},
    {{"round": 5, "trust_score": 70, "win_probability": 68, "momentum": "advancing"}},
    {{"round": 6, "trust_score": 75, "win_probability": 72, "momentum": "advancing"}}
  ]
}}

Return ONLY valid JSON. Make dialogue vivid and deal-specific."""

        text, err = self._call_claude(prompt, max_tokens=4000)
        if err or not text:
            return self._fallback_single_path(path_id, label, seller_strategy, buyer_stance)
        try:
            result = self._extract_json(text)
            if not isinstance(result, dict):
                return self._fallback_single_path(path_id, label, seller_strategy, buyer_stance)
            return result
        except Exception:
            return self._fallback_single_path(path_id, label, seller_strategy, buyer_stance)

    def _fallback_single_path(self, path_id: int, label: str, seller_strategy: str, buyer_stance: str) -> dict:
        outcome_map = {
            "Cooperative Champion": ("won", 75),
            "Procurement Blockade": ("stalled", 38),
            "Competitive Threat": ("lost", 30),
            "Budget Freeze / Exec Escalation": ("stalled", 50),
            "Champion Goes Cold": ("lost", 25),
            "Accelerated Close": ("won", 80),
        }
        outcome, prob = outcome_map.get(label, ("stalled", 50))
        return {
            "path_id": path_id, "label": label,
            "seller_strategy": seller_strategy, "buyer_stance": buyer_stance,
            "scenario_twist": None, "outcome": outcome,
            "win_probability": prob, "rounds_played": 0,
            "summary": f"Path '{label}' — AI generation failed, no turn data available.",
            "key_moments": [], "turns": [], "deal_state_evolution": [],
        }

    def run_path_monte_carlo(self, path_context: dict, deal_context: dict,
                              profiles: list, from_round: int, n_runs: int = 20) -> dict:
        """Run Monte Carlo from a specific point within a simulation path."""
        turns_so_far = [t for t in (path_context.get('turns') or []) if t.get('round', 0) <= from_round]
        state_at_round = next(
            (s for s in reversed(path_context.get('deal_state_evolution') or []) if s.get('round', 0) <= from_round),
            {'trust_score': 50, 'win_probability': 50, 'momentum': 'stalled'}
        )

        profile_summaries = [{'name': p.get('name'), 'role': p.get('role'),
                               'decision_style': p.get('decision_style'),
                               'risk_tolerance': p.get('risk_tolerance')} for p in profiles]

        turn_summary = '\n'.join(
            f"R{t.get('round')} {t.get('actor')}: {str(t.get('message',''))[:120]}"
            for t in turns_so_far[-12:]
        )

        prompt = f"""You are running {n_runs} Monte Carlo continuations of a negotiation from round {from_round}.

PATH SO FAR: {path_context.get('label', 'Simulation Path')}
SELLER STRATEGY: {path_context.get('seller_strategy', '')}

DEAL CONTEXT:
{json.dumps(deal_context, indent=2)}

BUYER PROFILES:
{json.dumps(profile_summaries, indent=2)}

CURRENT STATE (end of round {from_round}):
- Trust score: {state_at_round.get('trust_score', 50)}/100
- Win probability: {state_at_round.get('win_probability', 50)}%
- Momentum: {state_at_round.get('momentum', 'unknown')}

NEGOTIATION SO FAR:
{turn_summary}

Simulate {n_runs} independent continuations from this point with varying buyer behavior, market events, and seller approaches.

Return JSON:
{{
  "total_runs": {n_runs},
  "from_round": {from_round},
  "outcomes": {{"won": integer, "lost": integer, "stalled": integer, "walkaway": integer}},
  "win_rate": float 0.0-1.0,
  "avg_rounds_to_close": float,
  "avg_discount_needed": float 0.0-0.3,
  "risk_factors": ["top 3 risks from this point forward"],
  "success_patterns": ["top 3 things that lead to wins from here"],
  "confidence_interval": {{"low": float, "high": float}},
  "scenario_breakdown": [
    {{"scenario": "name", "win_rate": float, "description": "brief"}}
  ],
  "recommended_next_move": "1-2 sentence recommendation for what seller should do next"
}}

Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=2000)
        fallback = {
            "total_runs": n_runs, "from_round": from_round,
            "outcomes": {"won": 10, "lost": 5, "stalled": 4, "walkaway": 1},
            "win_rate": 0.5, "avg_rounds_to_close": 5.0, "avg_discount_needed": 0.1,
            "risk_factors": [], "success_patterns": [],
            "confidence_interval": {"low": 0.35, "high": 0.65},
            "scenario_breakdown": [], "recommended_next_move": "",
        }
        if err or not text:
            return fallback
        try:
            return self._extract_json(text)
        except Exception:
            return fallback


    def run_monte_carlo(self, game_setup: dict, profiles: list, n_runs: int = 20) -> dict:
        """Run Monte Carlo simulation and return aggregate statistics."""
        prompt = f"""Run {n_runs} independent pre-sales negotiation simulations with slight variations.

GAME SETUP:
{json.dumps(game_setup, indent=2)}

BUYER PROFILES (summary):
{json.dumps([{{'name': p.get('name'), 'role': p.get('role'), 'decision_style': p.get('decision_style')}} for p in profiles], indent=2)}

Simulate varying buyer behavior, market conditions, and seller approaches.

Return JSON:
{{
  "total_runs": {n_runs},
  "outcomes": {{
    "won": integer,
    "lost": integer,
    "stalled": integer,
    "walkaway": integer
  }},
  "win_rate": float 0.0-1.0,
  "avg_rounds_to_close": float,
  "avg_discount_needed": float,
  "risk_factors": ["top 3 risk factors identified across simulations"],
  "success_patterns": ["top 3 success patterns"],
  "confidence_interval": {{"low": float, "high": float}},
  "scenario_breakdown": [
    {{"scenario": "scenario name", "win_rate": float, "description": "brief description"}}
  ]
}}

Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=2000)
        if err or not text:
            return {
                "total_runs": n_runs,
                "outcomes": {"won": 10, "lost": 5, "stalled": 4, "walkaway": 1},
                "win_rate": 0.5,
                "avg_rounds_to_close": 7.0,
                "avg_discount_needed": 0.12,
                "risk_factors": ["Budget constraints", "Competitive pressure", "Champion instability"],
                "success_patterns": ["Early value anchoring", "Champion enablement", "Exec alignment"],
                "confidence_interval": {"low": 0.35, "high": 0.65},
                "scenario_breakdown": []
            }
        try:
            return self._extract_json(text)
        except Exception:
            return {
                "total_runs": n_runs,
                "outcomes": {"won": 10, "lost": 5, "stalled": 4, "walkaway": 1},
                "win_rate": 0.5,
                "avg_rounds_to_close": 7.0,
                "avg_discount_needed": 0.12,
                "risk_factors": [], "success_patterns": [],
                "confidence_interval": {"low": 0.35, "high": 0.65},
                "scenario_breakdown": []
            }
