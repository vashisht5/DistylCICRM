"""Dossier generation and retrieval"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from database import get_db
import models
from middleware.auth import require_login

dossiers_bp = Blueprint('dossiers', __name__)


@dossiers_bp.route('/api/dossiers', methods=['GET'])
@require_login
def get_dossiers():
    try:
        with get_db() as db:
            query = db.query(models.Dossier)
            if entity_id := request.args.get('entity_id'):
                query = query.filter(models.Dossier.entity_id == int(entity_id))
            dossiers = query.order_by(models.Dossier.generated_at.desc()).all()
            return jsonify({"dossiers": [d.to_dict() for d in dossiers]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dossiers_bp.route('/api/dossiers/<int:dossier_id>', methods=['GET'])
@require_login
def get_dossier(dossier_id):
    try:
        with get_db() as db:
            dossier = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
            if not dossier:
                return jsonify({"error": "Not found"}), 404
            return jsonify(dossier.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dossiers_bp.route('/api/dossiers/generate', methods=['POST'])
@require_login
def generate_dossier():
    """Trigger async dossier generation"""
    try:
        data = request.json or {}
        entity_id = data.get('entity_id')
        if not entity_id:
            return jsonify({"error": "entity_id required"}), 400

        with get_db() as db:
            entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
            if not entity:
                return jsonify({"error": "Entity not found"}), 404

            in_progress = db.query(models.Dossier).filter(
                models.Dossier.entity_id == entity_id,
                models.Dossier.generation_status == 'in_progress'
            ).first()
            if in_progress:
                return jsonify({"error": "Generation already in progress", "dossier_id": in_progress.id}), 409

            latest = db.query(models.Dossier).filter(
                models.Dossier.entity_id == entity_id
            ).order_by(models.Dossier.version.desc()).first()
            version = (latest.version + 1) if latest else 1

            dossier = models.Dossier(
                entity_id=entity_id,
                version=version,
                generation_status='pending',
                prompt_version='v1.0',
            )
            db.add(dossier)
            db.commit()
            db.refresh(dossier)
            dossier_id_new = dossier.id

        def _run_generation(dossier_id, eid):
            try:
                from ai.dossier_agent import DossierAgent
                DossierAgent().generate(dossier_id, eid)
            except Exception as gen_err:
                # Clean up orphaned row on failure
                try:
                    with get_db() as cleanup_db:
                        d = cleanup_db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
                        if d and d.generation_status == 'pending':
                            d.generation_status = 'failed'
                            cleanup_db.commit()
                except Exception:
                    pass

        import threading
        t = threading.Thread(target=_run_generation, args=(dossier_id_new, entity_id), daemon=True)
        t.start()

        return jsonify({"success": True, "dossier_id": dossier_id_new, "status": "pending", "version": version}), 202

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dossiers_bp.route('/api/dossiers/<int:dossier_id>/ceo-brief', methods=['GET'])
@require_login
def get_ceo_brief(dossier_id):
    """Get or generate CEO 1-page brief"""
    try:
        with get_db() as db:
            dossier = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
            if not dossier:
                return jsonify({"error": "Not found"}), 404

            if dossier.ceo_brief:
                return jsonify({"ceo_brief": dossier.ceo_brief, "dossier_id": dossier_id})

            entity = db.query(models.Entity).filter(models.Entity.id == dossier.entity_id).first()
            entity_name = entity.name if entity else "Unknown"

        from ai.dossier_agent import DossierAgent
        agent = DossierAgent()
        brief = agent.generate_ceo_brief(dossier_id, entity_name)

        with get_db() as db:
            d = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
            if d:
                d.ceo_brief = brief
                db.commit()

        return jsonify({"ceo_brief": brief, "dossier_id": dossier_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dossiers_bp.route('/api/dossiers/<int:dossier_id>/ceo-brief', methods=['POST'])
@require_login
def regenerate_ceo_brief(dossier_id):
    """Force regenerate CEO brief"""
    try:
        with get_db() as db:
            dossier = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
            if not dossier:
                return jsonify({"error": "Not found"}), 404
            entity = db.query(models.Entity).filter(models.Entity.id == dossier.entity_id).first()
            entity_name = entity.name if entity else "Unknown"

        from ai.dossier_agent import DossierAgent
        agent = DossierAgent()
        brief = agent.generate_ceo_brief(dossier_id, entity_name)

        with get_db() as db:
            d = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
            if d:
                d.ceo_brief = brief
                db.commit()

        return jsonify({"ceo_brief": brief, "dossier_id": dossier_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dossiers_bp.route('/api/dossiers/<int:dossier_id>/flag-hallucination', methods=['POST'])
@require_login
def flag_hallucination(dossier_id):
    try:
        data = request.json or {}
        with get_db() as db:
            dossier = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
            if not dossier:
                return jsonify({"error": "Not found"}), 404
            flags = dossier.hallucination_flags or []
            flags.append({
                "section": data.get('section'),
                "claim": data.get('claim'),
                "flagged_at": datetime.utcnow().isoformat()
            })
            dossier.hallucination_flags = flags
            db.commit()
            return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
