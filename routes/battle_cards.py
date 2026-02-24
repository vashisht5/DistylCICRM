"""Battle card generator"""
from flask import Blueprint, request, jsonify
from database import get_db
import models
from middleware.auth import require_login

battle_cards_bp = Blueprint('battle_cards', __name__)


@battle_cards_bp.route('/api/battle-cards', methods=['GET'])
@require_login
def get_battle_cards():
    try:
        with get_db() as db:
            query = db.query(models.BattleCard)
            if entity_id := request.args.get('entity_id'):
                query = query.filter(models.BattleCard.entity_id == int(entity_id))
            if status := request.args.get('status'):
                query = query.filter(models.BattleCard.status == status)

            cards = query.order_by(models.BattleCard.generated_at.desc()).all()
            result = []
            for c in cards:
                d = c.to_dict()
                entity = db.query(models.Entity).filter(models.Entity.id == c.entity_id).first()
                d['entity_name'] = entity.name if entity else None
                result.append(d)
            return jsonify({"battle_cards": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@battle_cards_bp.route('/api/battle-cards/<int:card_id>', methods=['GET'])
@require_login
def get_battle_card(card_id):
    try:
        with get_db() as db:
            card = db.query(models.BattleCard).filter(models.BattleCard.id == card_id).first()
            if not card:
                return jsonify({"error": "Not found"}), 404
            d = card.to_dict()
            entity = db.query(models.Entity).filter(models.Entity.id == card.entity_id).first()
            d['entity_name'] = entity.name if entity else None
            return jsonify(d)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@battle_cards_bp.route('/api/battle-cards/generate', methods=['POST'])
@require_login
def generate_battle_card():
    try:
        data = request.json or {}
        entity_id = data.get('entity_id')
        if not entity_id:
            return jsonify({"error": "entity_id required"}), 400

        with get_db() as db:
            entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
            if not entity:
                return jsonify({"error": "Entity not found"}), 404
            latest_dossier = db.query(models.Dossier).filter(
                models.Dossier.entity_id == entity_id,
                models.Dossier.generation_status == 'completed'
            ).order_by(models.Dossier.generated_at.desc()).first()
            dossier_id = latest_dossier.id if latest_dossier else None

        import threading
        from ai.battle_card_agent import BattleCardAgent

        def _gen():
            agent = BattleCardAgent()
            card_content = agent.generate(
                entity_id, dossier_id,
                data.get('use_case'), data.get('distyl_product')
            )
            with get_db() as db2:
                bc = models.BattleCard(
                    entity_id=entity_id,
                    dossier_id=dossier_id,
                    use_case=data.get('use_case'),
                    distyl_product=data.get('distyl_product'),
                    content=card_content,
                    status='draft',
                )
                db2.add(bc)
                db2.commit()

        threading.Thread(target=_gen, daemon=True).start()
        return jsonify({"success": True, "message": "Battle card generation started"}), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@battle_cards_bp.route('/api/battle-cards/<int:card_id>/approve', methods=['POST'])
@require_login
def approve_battle_card(card_id):
    try:
        with get_db() as db:
            card = db.query(models.BattleCard).filter(models.BattleCard.id == card_id).first()
            if not card:
                return jsonify({"error": "Not found"}), 404
            card.status = 'approved'
            db.commit()
            return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
