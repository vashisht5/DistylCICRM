"""
Enrichment routes
POST /api/enrich/entity/<id>  — enrich single entity (async thread)
POST /api/enrich/all          — enrich all active entities (queued)
GET  /api/enrich/status       — enrichment status per entity
"""
import threading
from datetime import datetime
from flask import Blueprint, jsonify, request
from database import get_db
from models import Entity
from middleware.auth import require_login

enrichment_bp = Blueprint('enrichment', __name__)

# Track in-progress enrichments: {entity_id: True}
_in_progress: dict = {}
# Store last result per entity: {entity_id: {"steps_completed": [...], "errors": [...], ...}}
_last_results: dict = {}


def _run_enrichment(entity_id: int):
    try:
        from ai.enrichment_agent import EnrichmentAgent
        agent = EnrichmentAgent()
        result = agent.enrich(entity_id)
        _last_results[entity_id] = result
        steps = result.get("steps_completed", [])
        errors = result.get("errors", [])
        print(f"[enrichment] entity {entity_id}: steps={steps} errors={errors}")
    except Exception as e:
        _last_results[entity_id] = {"errors": [str(e)], "steps_completed": []}
        print(f"[enrichment] entity {entity_id} failed: {e}")
    finally:
        _in_progress.pop(entity_id, None)


@enrichment_bp.route('/api/enrich/entity/<int:entity_id>', methods=['POST'])
@require_login
def enrich_entity(entity_id):
    """Enrich a single entity asynchronously."""
    with get_db() as db:
        entity = db.query(Entity).filter(Entity.id == entity_id).first()
        if not entity:
            return jsonify({"error": "Entity not found"}), 404
        name = entity.name

    if _in_progress.get(entity_id):
        return jsonify({"status": "already_running", "entity_id": entity_id}), 202

    _in_progress[entity_id] = True
    t = threading.Thread(target=_run_enrichment, args=(entity_id,), daemon=True)
    t.start()

    return jsonify({
        "status": "started",
        "entity_id": entity_id,
        "entity_name": name,
        "message": "Enrichment started in background",
    }), 202


@enrichment_bp.route('/api/enrich/all', methods=['POST'])
@require_login
def enrich_all():
    """Enrich all active entities that haven't been enriched recently."""
    from datetime import timedelta
    days = request.json.get('stale_days', 7) if request.json else 7

    with get_db() as db:
        cutoff = datetime.utcnow() - timedelta(days=days)
        entities = db.query(Entity).filter(
            Entity.status == 'active',
            (Entity.last_enriched_at == None) | (Entity.last_enriched_at < cutoff)
        ).all()
        to_enrich = [{"id": e.id, "name": e.name} for e in entities]

    started = 0
    skipped = 0
    for e in to_enrich:
        eid = e["id"]
        if _in_progress.get(eid):
            skipped += 1
            continue
        _in_progress[eid] = True
        t = threading.Thread(target=_run_enrichment, args=(eid,), daemon=True)
        t.start()
        started += 1

    return jsonify({
        "status": "queued",
        "started": started,
        "skipped_already_running": skipped,
        "total": len(to_enrich),
        "entities": to_enrich,
    }), 202


@enrichment_bp.route('/api/enrich/status', methods=['GET'])
@require_login
def enrich_status():
    """Return enrichment status for all entities."""
    with get_db() as db:
        entities = db.query(
            Entity.id,
            Entity.name,
            Entity.entity_type,
            Entity.last_enriched_at,
            Entity.icp_score,
            Entity.tech_stack,
        ).filter(Entity.status == 'active').all()

        result = []
        for e in entities:
            last = _last_results.get(e.id, {})
            result.append({
                "id": e.id,
                "name": e.name,
                "entity_type": e.entity_type,
                "last_enriched_at": e.last_enriched_at.isoformat() if e.last_enriched_at else None,
                "icp_score": e.icp_score,
                "has_tech_stack": bool(e.tech_stack),
                "enriching": _in_progress.get(e.id, False),
                "last_errors": last.get("errors", []),
                "last_steps_completed": last.get("steps_completed", []),
            })

    return jsonify({"entities": result, "in_progress_count": len(_in_progress)})
