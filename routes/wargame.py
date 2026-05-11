"""
Pre-Sales Intelligence + Wargame Platform routes.
Covers: StakeholderProfiles, DealIntel, Wargame, Sync
"""
import threading
from datetime import datetime
from flask import Blueprint, request, jsonify, session
from database import get_db
from models import (
    StakeholderProfile, DealIntel, Wargame, WargameParticipant, WargameTurn, Deal
)

wargame_bp = Blueprint('wargame', __name__)


def _current_user_id():
    u = session.get('user', {})
    return u.get('id') if u else None


# ── Stakeholder Profiles ──────────────────────────────────────────

@wargame_bp.route('/api/stakeholder-profiles', methods=['GET'])
def list_profiles():
    company = request.args.get('company')
    role = request.args.get('role')
    q = request.args.get('q')
    with get_db() as db:
        query = db.query(StakeholderProfile)
        if company:
            query = query.filter(StakeholderProfile.company.ilike(f'%{company}%'))
        if role:
            query = query.filter(StakeholderProfile.role == role)
        if q:
            query = query.filter(
                StakeholderProfile.name.ilike(f'%{q}%') |
                StakeholderProfile.company.ilike(f'%{q}%') |
                StakeholderProfile.title.ilike(f'%{q}%')
            )
        profiles = query.order_by(StakeholderProfile.updated_at.desc()).all()
        return jsonify([p.to_dict() for p in profiles])


@wargame_bp.route('/api/stakeholder-profiles', methods=['POST'])
def create_profile():
    data = request.get_json() or {}
    with get_db() as db:
        profile = StakeholderProfile(
            created_by=_current_user_id(),
            name=data.get('name', 'Unknown'),
            title=data.get('title'),
            company=data.get('company'),
            role=data.get('role'),
            reports_to_id=data.get('reports_to_id'),
            department=data.get('department'),
            budget_authority_usd=data.get('budget_authority_usd'),
            owns_budget_for=data.get('owns_budget_for'),
            team_size=data.get('team_size'),
            decision_style=data.get('decision_style'),
            risk_tolerance=data.get('risk_tolerance'),
            ego_level=data.get('ego_level'),
            orientation=data.get('orientation'),
            communication_style=data.get('communication_style'),
            primary_motivation=data.get('primary_motivation'),
            influence_level=data.get('influence_level'),
            technical_depth=data.get('technical_depth'),
            typical_opening_position=data.get('typical_opening_position'),
            hot_buttons=data.get('hot_buttons'),
            known_tactics=data.get('known_tactics'),
            concession_pattern=data.get('concession_pattern'),
            typical_objectives=data.get('typical_objectives'),
            typical_constraints=data.get('typical_constraints'),
            raw_notes=data.get('raw_notes'),
            attributes=data.get('attributes'),
            past_interactions=data.get('past_interactions'),
        )
        db.add(profile)
        db.flush()

        # If raw_notes provided, auto-parse them
        if data.get('raw_notes') and data.get('auto_parse', True):
            _apply_parsed_notes_to_profile(profile, data['raw_notes'])

        return jsonify(profile.to_dict()), 201


@wargame_bp.route('/api/stakeholder-profiles/parse', methods=['POST'])
def parse_profile_notes():
    """Preview parse of raw_notes — does not save."""
    data = request.get_json() or {}
    raw_notes = data.get('raw_notes', '')
    if not raw_notes:
        return jsonify({"error": "raw_notes required"}), 400

    existing = data.get('existing_fields', {})
    try:
        from ai.attribute_parser import AttributeParser
        parser = AttributeParser()
        result = parser.parse_stakeholder_notes(raw_notes, existing)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@wargame_bp.route('/api/stakeholder-profiles/<int:profile_id>', methods=['GET'])
def get_profile(profile_id):
    with get_db() as db:
        profile = db.query(StakeholderProfile).filter(StakeholderProfile.id == profile_id).first()
        if not profile:
            return jsonify({"error": "Not found"}), 404
        result = profile.to_dict()
        # Include direct reports count
        result['direct_reports_count'] = db.query(StakeholderProfile).filter(
            StakeholderProfile.reports_to_id == profile_id
        ).count()
        return jsonify(result)


@wargame_bp.route('/api/stakeholder-profiles/<int:profile_id>', methods=['PUT'])
def update_profile(profile_id):
    data = request.get_json() or {}
    with get_db() as db:
        profile = db.query(StakeholderProfile).filter(StakeholderProfile.id == profile_id).first()
        if not profile:
            return jsonify({"error": "Not found"}), 404

        updatable = [
            'name', 'title', 'company', 'role', 'reports_to_id', 'department',
            'budget_authority_usd', 'owns_budget_for', 'team_size', 'decision_style',
            'risk_tolerance', 'ego_level', 'orientation', 'communication_style',
            'primary_motivation', 'influence_level', 'technical_depth',
            'typical_opening_position', 'hot_buttons', 'known_tactics', 'concession_pattern',
            'typical_objectives', 'typical_constraints', 'raw_notes', 'attributes',
            'past_interactions', 'win_rate',
        ]
        for field in updatable:
            if field in data:
                setattr(profile, field, data[field])

        profile.updated_at = datetime.utcnow()

        # Re-parse notes if raw_notes changed
        if 'raw_notes' in data and data.get('raw_notes'):
            _apply_parsed_notes_to_profile(profile, data['raw_notes'])

        return jsonify(profile.to_dict())


@wargame_bp.route('/api/stakeholder-profiles/<int:profile_id>', methods=['DELETE'])
def delete_profile(profile_id):
    with get_db() as db:
        profile = db.query(StakeholderProfile).filter(StakeholderProfile.id == profile_id).first()
        if not profile:
            return jsonify({"error": "Not found"}), 404
        db.delete(profile)
    return jsonify({"ok": True})


@wargame_bp.route('/api/stakeholder-profiles/<int:profile_id>/reports', methods=['GET'])
def get_reports(profile_id):
    """Get direct reports (org tree)."""
    with get_db() as db:
        reports = db.query(StakeholderProfile).filter(
            StakeholderProfile.reports_to_id == profile_id
        ).all()
        return jsonify([r.to_dict() for r in reports])


def _apply_parsed_notes_to_profile(profile, raw_notes: str):
    """Parse raw_notes and apply structured fields to profile (in-place, no DB commit needed)."""
    try:
        from ai.attribute_parser import AttributeParser
        parser = AttributeParser()
        existing = {
            'decision_style': profile.decision_style,
            'risk_tolerance': profile.risk_tolerance,
            'role': profile.role,
        }
        result = parser.parse_stakeholder_notes(raw_notes, existing)

        field_updates = result.get('field_updates', {})
        # Apply simple field updates (skip reports_to_name - needs separate lookup)
        simple_fields = [
            'title', 'company', 'department', 'role', 'decision_style', 'risk_tolerance',
            'ego_level', 'orientation', 'communication_style', 'primary_motivation',
            'influence_level', 'technical_depth', 'budget_authority_usd', 'owns_budget_for',
            'team_size', 'concession_pattern', 'typical_opening_position',
        ]
        for field in simple_fields:
            if field in field_updates and field_updates[field] is not None:
                setattr(profile, field, field_updates[field])

        if result.get('hot_buttons'):
            profile.hot_buttons = result['hot_buttons']
        if result.get('known_tactics'):
            profile.known_tactics = result['known_tactics']
        if result.get('typical_objectives'):
            profile.typical_objectives = result['typical_objectives']
        if result.get('typical_constraints'):
            profile.typical_constraints = result['typical_constraints']

        # Merge attributes
        existing_attrs = profile.attributes or {}
        new_attrs = result.get('attributes', {})
        existing_attrs.update(new_attrs)
        profile.attributes = existing_attrs

    except Exception as e:
        print(f"Auto-parse error: {e}")


# ── Deal Intel ────────────────────────────────────────────────────

@wargame_bp.route('/api/deals/<int:deal_id>/intel', methods=['GET'])
def get_deal_intel(deal_id):
    with get_db() as db:
        intel = db.query(DealIntel).filter(DealIntel.deal_id == deal_id).first()
        if not intel:
            # Auto-create
            intel = DealIntel(deal_id=deal_id)
            db.add(intel)
            db.flush()
        return jsonify(intel.to_dict())


@wargame_bp.route('/api/deals/<int:deal_id>/intel', methods=['PUT'])
def update_deal_intel(deal_id):
    data = request.get_json() or {}
    with get_db() as db:
        intel = db.query(DealIntel).filter(DealIntel.deal_id == deal_id).first()
        if not intel:
            intel = DealIntel(deal_id=deal_id)
            db.add(intel)
            db.flush()

        updatable = [
            'presales_stage', 'metrics', 'economic_buyer_profile_id', 'economic_buyer_notes',
            'decision_criteria', 'decision_process', 'identified_pain',
            'champion_profile_id', 'champion_notes', 'stakeholder_map',
            'seller_batna', 'buyer_batna_estimate', 'key_risks', 'next_steps',
            'raw_notes', 'attributes',
        ]
        for field in updatable:
            if field in data:
                setattr(intel, field, data[field])

        intel.updated_at = datetime.utcnow()

        # Re-parse notes if raw_notes changed
        if 'raw_notes' in data and data.get('raw_notes'):
            _apply_parsed_notes_to_intel(intel, data['raw_notes'])

        return jsonify(intel.to_dict())


@wargame_bp.route('/api/deals/<int:deal_id>/intel/parse', methods=['POST'])
def parse_deal_intel_notes(deal_id):
    """Preview parse of raw_notes for deal intel — does not save."""
    data = request.get_json() or {}
    raw_notes = data.get('raw_notes', '')
    if not raw_notes:
        return jsonify({"error": "raw_notes required"}), 400

    existing = data.get('existing_fields', {})
    try:
        from ai.attribute_parser import AttributeParser
        parser = AttributeParser()
        result = parser.parse_deal_notes(raw_notes, existing)

        # Try to match named people to existing profiles
        _match_people_to_profiles(result, deal_id)

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _apply_parsed_notes_to_intel(intel, raw_notes: str):
    """Parse raw_notes and apply structured MEDDIC fields to DealIntel."""
    try:
        from ai.attribute_parser import AttributeParser
        parser = AttributeParser()
        existing = {'presales_stage': intel.presales_stage}
        result = parser.parse_deal_notes(raw_notes, existing)

        field_updates = result.get('field_updates', {})
        simple_fields = [
            'presales_stage', 'metrics', 'identified_pain', 'decision_process',
            'seller_batna', 'buyer_batna_estimate',
        ]
        for field in simple_fields:
            if field in field_updates and field_updates[field] is not None:
                setattr(intel, field, field_updates[field])

        if field_updates.get('decision_criteria'):
            intel.decision_criteria = field_updates['decision_criteria']
        if result.get('key_risks'):
            intel.key_risks = result['key_risks']
        if result.get('next_steps'):
            intel.next_steps = result['next_steps']

        # Merge attributes
        existing_attrs = intel.attributes or {}
        new_attrs = result.get('attributes', {})
        existing_attrs.update(new_attrs)
        intel.attributes = existing_attrs

        # Try to match named people to profiles
        _match_people_to_profiles_inline(intel, field_updates)

    except Exception as e:
        print(f"Deal intel auto-parse error: {e}")


def _match_people_to_profiles(result: dict, deal_id: int):
    """Enrich parse result with matched profile IDs."""
    try:
        from database import get_db
        from models import StakeholderProfile
        with get_db() as db:
            for field_key in ['economic_buyer_name', 'champion_name']:
                name = result.get('field_updates', {}).get(field_key)
                if name:
                    profile = db.query(StakeholderProfile).filter(
                        StakeholderProfile.name.ilike(f'%{name}%')
                    ).first()
                    if profile:
                        result['field_updates'][field_key.replace('_name', '_profile_id')] = profile.id
                        result['field_updates'][field_key.replace('_name', '_display')] = profile.name
    except Exception:
        pass


def _match_people_to_profiles_inline(intel, field_updates: dict):
    """Match named people in field_updates to StakeholderProfile IDs."""
    try:
        from database import get_db
        from models import StakeholderProfile
        with get_db() as db:
            eb_name = field_updates.get('economic_buyer_name')
            if eb_name and not intel.economic_buyer_profile_id:
                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.name.ilike(f'%{eb_name}%')
                ).first()
                if profile:
                    intel.economic_buyer_profile_id = profile.id

            champ_name = field_updates.get('champion_name')
            if champ_name and not intel.champion_profile_id:
                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.name.ilike(f'%{champ_name}%')
                ).first()
                if profile:
                    intel.champion_profile_id = profile.id
    except Exception:
        pass


# ── Wargame ───────────────────────────────────────────────────────

@wargame_bp.route('/api/wargame', methods=['GET'])
def list_wargames():
    status_filter = request.args.get('status')
    with get_db() as db:
        query = db.query(Wargame)
        if status_filter:
            query = query.filter(Wargame.status == status_filter)
        games = query.order_by(Wargame.updated_at.desc()).limit(50).all()
        return jsonify([g.to_dict() for g in games])


@wargame_bp.route('/api/wargame', methods=['POST'])
def create_wargame():
    data = request.get_json() or {}
    with get_db() as db:
        game = Wargame(
            name=data.get('name', 'New Wargame'),
            deal_id=data.get('deal_id'),
            created_by=_current_user_id(),
            presales_stage=data.get('presales_stage', 'negotiation'),
            scenario_type=data.get('scenario_type', 'standard'),
            deal_context=data.get('deal_context', {}),
            max_rounds=data.get('max_rounds', 10),
            status='setup',
        )
        db.add(game)
        db.flush()

        # Create participants from provided list
        for p_data in data.get('participants', []):
            participant = WargameParticipant(
                wargame_id=game.id,
                profile_id=p_data.get('profile_id'),
                team=p_data.get('team', 'buyer'),
                objectives_override=p_data.get('objectives_override'),
                constraints_override=p_data.get('constraints_override'),
                opening_notes=p_data.get('opening_notes', ''),
                current_trust_score=50,
                engagement_level='moderate',
            )
            db.add(participant)

        return jsonify(game.to_dict()), 201


@wargame_bp.route('/api/wargame/<int:game_id>', methods=['GET'])
def get_wargame(game_id):
    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404
        result = game.to_dict()

        # Include participants with profiles
        participants = db.query(WargameParticipant).filter(
            WargameParticipant.wargame_id == game_id
        ).all()
        participants_data = []
        for p in participants:
            pd = p.to_dict()
            if p.profile_id:
                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.id == p.profile_id
                ).first()
                pd['profile'] = profile.to_dict() if profile else None
            participants_data.append(pd)
        result['participants'] = participants_data

        # Include recent turns
        turns = db.query(WargameTurn).filter(
            WargameTurn.wargame_id == game_id
        ).order_by(WargameTurn.id.asc()).all()
        result['turns'] = [t.to_dict() for t in turns]

        return jsonify(result)


@wargame_bp.route('/api/wargame/<int:game_id>/start', methods=['POST'])
def start_wargame(game_id):
    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404
        if game.status not in ('setup', 'active'):
            return jsonify({"error": f"Cannot start game in status '{game.status}'"}), 400

        game.status = 'active'
        game.current_round = 0
        game.updated_at = datetime.utcnow()

        # Generate opening buyer positions using AI
        participants = db.query(WargameParticipant).filter(
            WargameParticipant.wargame_id == game_id,
            WargameParticipant.team == 'buyer',
        ).all()

        opening_turns = []
        for p in participants:
            profile = None
            if p.profile_id:
                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.id == p.profile_id
                ).first()

            try:
                from ai.wargame_agent import WargameAgent
                agent = WargameAgent()
                persona = agent.generate_ai_persona(
                    role=profile.role if profile else 'buyer',
                    deal_context=game.deal_context or {},
                    presales_stage=game.presales_stage,
                )
                opening_turns.append({
                    'participant_id': p.id,
                    'actor_label': profile.name if profile else f'Buyer {p.id}',
                    'persona': persona,
                })

                # Save opening intelligence briefing turn
                turn = WargameTurn(
                    wargame_id=game_id,
                    round_number=0,
                    participant_id=p.id,
                    actor_label=profile.name if profile else f'Buyer {p.id}',
                    action_type='intelligence_briefing',
                    content={
                        'persona': persona,
                        'message': persona.get('opening_position', 'Ready to negotiate.'),
                    },
                    reasoning=f"Stage: {game.presales_stage}",
                )
                db.add(turn)
            except Exception as e:
                print(f"Error generating persona for participant {p.id}: {e}")

        return jsonify({**game.to_dict(), 'opening_briefings': opening_turns})


@wargame_bp.route('/api/wargame/<int:game_id>/turn', methods=['POST'])
def submit_turn(game_id):
    """Submit a seller turn and get AI buyer responses."""
    data = request.get_json() or {}
    user_move = data.get('move', {})

    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404
        if game.status not in ('active',):
            return jsonify({"error": f"Game not active (status: {game.status})"}), 400

        game.current_round += 1
        game.status = 'processing_turn'
        game.updated_at = datetime.utcnow()

        # Save seller turn
        seller_turn = WargameTurn(
            wargame_id=game_id,
            round_number=game.current_round,
            actor_label='Seller',
            action_type=user_move.get('action_type', 'offer'),
            content=user_move,
            reasoning=user_move.get('reasoning', ''),
        )
        db.add(seller_turn)
        db.flush()

        # Get turn history
        turn_history = [t.to_dict() for t in db.query(WargameTurn).filter(
            WargameTurn.wargame_id == game_id
        ).order_by(WargameTurn.id.asc()).all()]

        deal_state = game.deal_context or {}

        # Generate AI buyer responses
        buyers = db.query(WargameParticipant).filter(
            WargameParticipant.wargame_id == game_id,
            WargameParticipant.team == 'buyer',
        ).all()

        ai_responses = []
        for buyer in buyers:
            profile = None
            if buyer.profile_id:
                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.id == buyer.profile_id
                ).first()

            try:
                from ai.wargame_agent import WargameAgent
                agent = WargameAgent()
                response = agent.play_turn(
                    participant=buyer.to_dict(),
                    profile=profile.to_dict() if profile else {},
                    deal_state=deal_state,
                    turn_history=turn_history,
                    user_move=user_move,
                    stage=game.presales_stage,
                )

                # Update buyer trust score
                trust_delta = response.get('trust_delta', 0)
                buyer.current_trust_score = max(0, min(100, (buyer.current_trust_score or 50) + trust_delta))
                buyer.engagement_level = response.get('engagement_level', buyer.engagement_level)

                # Save buyer turn
                buyer_turn = WargameTurn(
                    wargame_id=game_id,
                    round_number=game.current_round,
                    participant_id=buyer.id,
                    actor_label=profile.name if profile else f'Buyer {buyer.id}',
                    action_type=response.get('action_type', 'counter_offer'),
                    content=response.get('content', {}),
                    reasoning=response.get('reasoning', ''),
                    deal_state_delta=response.get('deal_state_delta', {}),
                )
                db.add(buyer_turn)

                ai_responses.append({
                    'participant_id': buyer.id,
                    'actor_label': profile.name if profile else f'Buyer {buyer.id}',
                    'response': response,
                })

            except Exception as e:
                print(f"Error generating buyer response: {e}")

        # Adjudicate
        adj_result = {}
        try:
            from ai.wargame_agent import WargameAgent
            agent = WargameAgent()
            adj_result = agent.adjudicate(
                user_move=user_move,
                ai_responses=[r['response'] for r in ai_responses],
                deal_state=deal_state,
                participants=[b.to_dict() for b in buyers],
                stage=game.presales_stage,
            )

            # Save adjudication turn
            adj_turn = WargameTurn(
                wargame_id=game_id,
                round_number=game.current_round,
                actor_label='Adjudicator',
                action_type='adjudication',
                content=adj_result,
                reasoning=adj_result.get('summary', ''),
            )
            db.add(adj_turn)

            # Check for game-ending signals
            if adj_result.get('outcome_signal') == 'close_possible' and game.current_round >= 3:
                pass  # Could auto-close; for now just record
            elif game.current_round >= game.max_rounds:
                game.status = 'completed'
                game.outcome = adj_result.get('outcome_signal', 'stalled')
            else:
                game.status = 'active'

        except Exception as e:
            print(f"Adjudication error: {e}")
            game.status = 'active'

        return jsonify({
            'round': game.current_round,
            'ai_responses': ai_responses,
            'adjudication': adj_result,
            'game_status': game.status,
        })


@wargame_bp.route('/api/wargame/<int:game_id>/autorun', methods=['POST'])
def toggle_autorun(game_id):
    """Toggle auto-run mode — AI plays both sides."""
    data = request.get_json() or {}
    enabled = data.get('enabled', True)
    strategy = data.get('seller_strategy', 'Win at best available terms')

    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404

        if not enabled:
            if game.status == 'auto_running':
                game.status = 'active'
            return jsonify(game.to_dict())

        if game.status not in ('active', 'setup'):
            return jsonify({"error": f"Cannot auto-run from status '{game.status}'"}), 400

        game.status = 'auto_running'
        game.updated_at = datetime.utcnow()
        game_id_copy = game.id
        stage = game.presales_stage
        max_rounds = game.max_rounds
        current_round = game.current_round

    # Run auto-run in background thread
    def _run_auto():
        try:
            _execute_autorun(game_id_copy, stage, strategy, max_rounds, current_round)
        except Exception as e:
            print(f"Auto-run error for game {game_id_copy}: {e}")
            with get_db() as db:
                g = db.query(Wargame).filter(Wargame.id == game_id_copy).first()
                if g:
                    g.status = 'active'

    t = threading.Thread(target=_run_auto, daemon=True)
    t.start()

    return jsonify({"ok": True, "status": "auto_running"})


def _execute_autorun(game_id: int, stage: str, strategy: str, max_rounds: int, start_round: int):
    """Run the auto-run simulation loop."""
    from ai.wargame_agent import WargameAgent
    agent = WargameAgent()

    for round_num in range(start_round + 1, max_rounds + 1):
        with get_db() as db:
            game = db.query(Wargame).filter(Wargame.id == game_id).first()
            if not game or game.status != 'auto_running':
                break

            turn_history = [t.to_dict() for t in db.query(WargameTurn).filter(
                WargameTurn.wargame_id == game_id
            ).order_by(WargameTurn.id.asc()).all()]

            buyers = db.query(WargameParticipant).filter(
                WargameParticipant.wargame_id == game_id,
                WargameParticipant.team == 'buyer',
            ).all()

            deal_state = game.deal_context or {}
            buyer_moves = [t for t in turn_history if t.get('actor_label') != 'Seller']

            # Seller move
            seller_move = agent.play_seller_turn(
                strategy=strategy,
                deal_state=deal_state,
                turn_history=turn_history,
                buyer_moves=buyer_moves[-3:] if buyer_moves else [],
                stage=stage,
            )

            game.current_round = round_num
            seller_turn = WargameTurn(
                wargame_id=game_id,
                round_number=round_num,
                actor_label='Seller (AI)',
                action_type=seller_move.get('action_type', 'offer'),
                content=seller_move,
                reasoning=seller_move.get('reasoning', ''),
            )
            db.add(seller_turn)
            db.flush()

            # Buyer responses
            ai_responses = []
            for buyer in buyers:
                profile = None
                if buyer.profile_id:
                    profile = db.query(StakeholderProfile).filter(
                        StakeholderProfile.id == buyer.profile_id
                    ).first()

                response = agent.play_turn(
                    participant=buyer.to_dict(),
                    profile=profile.to_dict() if profile else {},
                    deal_state=deal_state,
                    turn_history=turn_history,
                    user_move=seller_move,
                    stage=stage,
                )

                trust_delta = response.get('trust_delta', 0)
                buyer.current_trust_score = max(0, min(100, (buyer.current_trust_score or 50) + trust_delta))
                buyer.engagement_level = response.get('engagement_level', buyer.engagement_level)

                buyer_turn = WargameTurn(
                    wargame_id=game_id,
                    round_number=round_num,
                    participant_id=buyer.id,
                    actor_label=profile.name if profile else f'Buyer {buyer.id}',
                    action_type=response.get('action_type', 'counter_offer'),
                    content=response.get('content', {}),
                    reasoning=response.get('reasoning', ''),
                )
                db.add(buyer_turn)
                ai_responses.append(response)

            # Adjudicate
            adj = agent.adjudicate(
                user_move=seller_move,
                ai_responses=ai_responses,
                deal_state=deal_state,
                participants=[b.to_dict() for b in buyers],
                stage=stage,
            )

            adj_turn = WargameTurn(
                wargame_id=game_id,
                round_number=round_num,
                actor_label='Adjudicator',
                action_type='adjudication',
                content=adj,
                reasoning=adj.get('summary', ''),
            )
            db.add(adj_turn)

            # Check for game end
            if adj.get('outcome_signal') in ('close_possible',) and round_num >= 5:
                game.status = 'completed'
                game.outcome = 'won'
                break
            elif adj.get('outcome_signal') == 'walkaway_risk' and round_num >= 3:
                game.status = 'completed'
                game.outcome = 'lost'
                break

            game.status = 'auto_running'
            game.updated_at = datetime.utcnow()

        # Small sleep between rounds to allow status checks
        import time
        time.sleep(0.5)

    # Mark complete if still running
    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if game and game.status == 'auto_running':
            game.status = 'completed'
            if not game.outcome:
                game.outcome = 'stalled'
            game.updated_at = datetime.utcnow()


@wargame_bp.route('/api/wargame/<int:game_id>/inject', methods=['POST'])
def inject_scenario(game_id):
    """Red-team scenario injection."""
    data = request.get_json() or {}
    scenario = data.get('scenario', '')
    description = data.get('description', '')

    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404

        game.current_round += 1
        turn = WargameTurn(
            wargame_id=game_id,
            round_number=game.current_round,
            actor_label='Game Master',
            action_type='scenario_inject',
            content={'scenario': scenario, 'description': description},
            reasoning=f'Red-team injection: {scenario}',
        )
        db.add(turn)

        return jsonify({"ok": True, "round": game.current_round})


@wargame_bp.route('/api/wargame/<int:game_id>/analysis', methods=['GET'])
def get_analysis(game_id):
    """Get post-game analysis."""
    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404

        # Return cached analysis if available
        if game.analysis:
            return jsonify(game.analysis)

        # Generate analysis
        participants = db.query(WargameParticipant).filter(
            WargameParticipant.wargame_id == game_id
        ).all()
        turns = db.query(WargameTurn).filter(
            WargameTurn.wargame_id == game_id
        ).order_by(WargameTurn.id.asc()).all()

        profiles = []
        for p in participants:
            if p.profile_id:
                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.id == p.profile_id
                ).first()
                if profile:
                    profiles.append(profile.to_dict())

        try:
            from ai.wargame_agent import WargameAgent
            agent = WargameAgent()
            analysis = agent.analyze_game(
                wargame=game.to_dict(),
                turns=[t.to_dict() for t in turns],
                participants=[p.to_dict() for p in participants],
                profiles=profiles,
            )
            game.analysis = analysis
            game.updated_at = datetime.utcnow()
            return jsonify(analysis)
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@wargame_bp.route('/api/wargame/<int:game_id>/monte-carlo', methods=['POST'])
def run_monte_carlo_route(game_id):
    """Run Monte Carlo simulations using the native probabilistic engine."""
    data = request.get_json() or {}
    n_runs = min(int(data.get('n_runs', 500)), 2000)

    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404

        game.monte_carlo_status = 'running'
        game.updated_at = datetime.utcnow()

        participants_raw = db.query(WargameParticipant).filter(
            WargameParticipant.wargame_id == game_id
        ).all()
        participants = []
        for p in participants_raw:
            pd = p.to_dict()
            if p.profile_id:
                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.id == p.profile_id
                ).first()
                if profile:
                    pd['profile'] = profile.to_dict()
            participants.append(pd)

        game_setup = game.to_dict()
        seller_strategy = data.get('seller_strategy', '')
        mc_config = data.get('config', {})
        game_id_copy = game_id

    def _run():
        try:
            from ai.monte_carlo_engine import run_monte_carlo
            results = run_monte_carlo(
                game_setup=game_setup,
                participants=participants,
                n_runs=n_runs,
                seller_strategy=seller_strategy,
                config=mc_config,
            )
            with get_db() as db:
                g = db.query(Wargame).filter(Wargame.id == game_id_copy).first()
                if g:
                    g.monte_carlo_results = results
                    g.monte_carlo_status = 'complete'
                    g.updated_at = datetime.utcnow()
        except Exception as e:
            print(f"Monte Carlo error: {e}")
            import traceback; traceback.print_exc()
            with get_db() as db:
                g = db.query(Wargame).filter(Wargame.id == game_id_copy).first()
                if g:
                    g.monte_carlo_status = 'failed'

    threading.Thread(target=_run, daemon=True).start()
    return jsonify({"ok": True, "status": "running", "n_runs": n_runs})


# ── Sync Status ───────────────────────────────────────────────────

@wargame_bp.route('/api/sync/status', methods=['GET'])
def sync_status():
    from jobs.content_sweep import get_sync_status
    status = get_sync_status()
    return jsonify(status)


@wargame_bp.route('/api/sync/granola', methods=['POST'])
def sync_granola():
    def _run():
        from jobs.content_sweep import _sweep_granola
        state = {}
        count = _sweep_granola(state)
        print(f"Manual Granola sync: {count} notes processed")

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return jsonify({"ok": True, "status": "started"})


@wargame_bp.route('/api/sync/gdocs', methods=['POST'])
def sync_gdocs():
    def _run():
        from jobs.content_sweep import _sweep_gdocs
        state = {}
        count = _sweep_gdocs(state)
        print(f"Manual GDocs sync: {count} docs processed")

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return jsonify({"ok": True, "status": "started"})


@wargame_bp.route('/api/sync/slack', methods=['POST'])
def sync_slack():
    def _run():
        from jobs.slack_sweep import run_slack_sweep
        run_slack_sweep()

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return jsonify({"ok": True, "status": "started"})


# ── Simulation Paths ──────────────────────────────────────────────

@wargame_bp.route('/api/wargame/<int:game_id>/simulate-paths', methods=['POST'])
def simulate_paths(game_id):
    """Run full multi-path simulation — all paths generated in one AI call."""
    data = request.get_json() or {}
    n_paths = min(data.get('n_paths', 4), 6)

    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404

        game.simulation_status = 'running'
        game.updated_at = datetime.utcnow()

        participants = db.query(WargameParticipant).filter(
            WargameParticipant.wargame_id == game_id
        ).all()
        profiles = []
        for p in participants:
            if p.profile_id:
                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.id == p.profile_id
                ).first()
                if profile:
                    profiles.append(profile.to_dict())

        game_setup = {**game.to_dict(), 'participants': [p.to_dict() for p in participants]}

    def _run():
        try:
            from ai.wargame_agent import WargameAgent
            agent = WargameAgent()
            paths = agent.simulate_paths(game_setup, profiles, n_paths)
            with get_db() as db:
                g = db.query(Wargame).filter(Wargame.id == game_id).first()
                if g:
                    g.simulation_paths = paths
                    g.simulation_status = 'complete'
                    g.updated_at = datetime.utcnow()
        except Exception as e:
            print(f"simulate_paths error: {e}")
            with get_db() as db:
                g = db.query(Wargame).filter(Wargame.id == game_id).first()
                if g:
                    g.simulation_status = 'failed'

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return jsonify({"ok": True, "status": "running", "n_paths": n_paths})


@wargame_bp.route('/api/wargame/<int:game_id>/simulation-paths', methods=['GET'])
def get_simulation_paths(game_id):
    """Get simulation paths result."""
    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404
        return jsonify({
            "simulation_status": game.simulation_status or 'idle',
            "simulation_paths": game.simulation_paths or [],
        })


@wargame_bp.route('/api/wargame/<int:game_id>/path-monte-carlo', methods=['POST'])
def path_monte_carlo(game_id):
    """Run Monte Carlo from a specific point within a simulation path."""
    data = request.get_json() or {}
    path_index = data.get('path_index', 0)
    from_round = data.get('from_round')
    n_runs = min(int(data.get('n_runs', 500)), 2000)
    mc_config = data.get('config', {})

    with get_db() as db:
        game = db.query(Wargame).filter(Wargame.id == game_id).first()
        if not game:
            return jsonify({"error": "Not found"}), 404

        paths = list(game.simulation_paths or [])
        if path_index >= len(paths):
            return jsonify({"error": "Path index out of range"}), 400

        path_context = paths[path_index]
        # Default from_round to last round in path
        if from_round is None:
            rounds = [t.get('round', 0) for t in (path_context.get('turns') or [])]
            from_round = max(rounds) if rounds else 3

        participants_raw = db.query(WargameParticipant).filter(
            WargameParticipant.wargame_id == game_id
        ).all()
        participants = []
        for p in participants_raw:
            pd = p.to_dict()
            if p.profile_id:
                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.id == p.profile_id
                ).first()
                if profile:
                    pd['profile'] = profile.to_dict()
            participants.append(pd)

        deal_context = {**(game.deal_context or {}), 'max_rounds': game.max_rounds}
        game_id_copy = game_id

    # Mark path as running MC
    def _run():
        try:
            from ai.monte_carlo_engine import run_path_monte_carlo
            result = run_path_monte_carlo(path_context, deal_context, participants, from_round, n_runs, config=mc_config)
            with get_db() as db:
                g = db.query(Wargame).filter(Wargame.id == game_id_copy).first()
                if g and g.simulation_paths:
                    updated = list(g.simulation_paths)
                    if path_index < len(updated):
                        updated[path_index] = dict(updated[path_index])
                        updated[path_index]['monte_carlo'] = result
                        updated[path_index]['monte_carlo_status'] = 'complete'
                        g.simulation_paths = updated
                        g.updated_at = datetime.utcnow()
        except Exception as e:
            print(f"path_monte_carlo error: {e}")
            with get_db() as db:
                g = db.query(Wargame).filter(Wargame.id == game_id_copy).first()
                if g and g.simulation_paths:
                    updated = list(g.simulation_paths)
                    if path_index < len(updated):
                        updated[path_index] = dict(updated[path_index])
                        updated[path_index]['monte_carlo_status'] = 'failed'
                        g.simulation_paths = updated

    # Mark as running before thread starts
    with get_db() as db:
        g = db.query(Wargame).filter(Wargame.id == game_id).first()
        if g and g.simulation_paths:
            updated = list(g.simulation_paths)
            if path_index < len(updated):
                updated[path_index] = dict(updated[path_index])
                updated[path_index]['monte_carlo_status'] = 'running'
                updated[path_index]['monte_carlo_from_round'] = from_round
                g.simulation_paths = updated
                g.updated_at = datetime.utcnow()

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return jsonify({"ok": True, "status": "running", "path_index": path_index, "from_round": from_round})
