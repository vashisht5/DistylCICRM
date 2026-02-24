"""
Entity Registry — competitors, targets, partners
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import or_
from database import get_db
import models
from middleware.auth import require_login

entities_bp = Blueprint('entities', __name__)


@entities_bp.route('/api/entities', methods=['GET'])
@require_login
def get_entities():
    try:
        with get_db() as db:
            query = db.query(models.Entity)

            if entity_type := request.args.get('entity_type'):
                query = query.filter(models.Entity.entity_type == entity_type)
            if status := request.args.get('status'):
                query = query.filter(models.Entity.status == status)
            if threat_level := request.args.get('threat_level'):
                query = query.filter(models.Entity.threat_level == threat_level)
            if search := request.args.get('search'):
                query = query.filter(
                    or_(models.Entity.name.ilike(f'%{search}%'),
                        models.Entity.description.ilike(f'%{search}%'))
                )

            total = query.count()
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 50))
            entities = query.order_by(models.Entity.name).offset((page - 1) * per_page).limit(per_page).all()

            result = []
            for e in entities:
                d = e.to_dict()
                d['signal_count'] = db.query(models.Signal).filter(
                    models.Signal.entity_id == e.id,
                    models.Signal.status == 'new'
                ).count()
                latest = db.query(models.Dossier).filter(
                    models.Dossier.entity_id == e.id,
                    models.Dossier.generation_status == 'completed'
                ).order_by(models.Dossier.generated_at.desc()).first()
                d['latest_dossier'] = {
                    "id": latest.id,
                    "version": latest.version,
                    "generated_at": latest.generated_at.isoformat() if latest.generated_at else None,
                    "overall_confidence": latest.overall_confidence
                } if latest else None
                result.append(d)

            return jsonify({"entities": result, "total": total, "page": page, "per_page": per_page})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@entities_bp.route('/api/entities', methods=['POST'])
@require_login
def create_entity():
    try:
        data = request.json or {}
        if not data.get('name'):
            return jsonify({"error": "Name required"}), 400
        if not data.get('entity_type'):
            return jsonify({"error": "entity_type required"}), 400

        with get_db() as db:
            existing = db.query(models.Entity).filter(models.Entity.name == data['name']).first()
            if existing:
                return jsonify({"error": "Entity already exists"}), 409

            entity = models.Entity(
                name=data['name'],
                entity_type=data['entity_type'],
                website=data.get('website'),
                description=data.get('description'),
                headquarters=data.get('headquarters'),
                employee_count=data.get('employee_count'),
                funding_stage=data.get('funding_stage'),
                industry=data.get('industry'),
                primary_use_cases=data.get('primary_use_cases'),
                known_clients=data.get('known_clients'),
                products=data.get('products'),
                distyl_exposure=data.get('distyl_exposure', 'none'),
                threat_level=data.get('threat_level', 'monitor'),
                status=data.get('status', 'active'),
            )
            db.add(entity)
            db.commit()
            db.refresh(entity)
            return jsonify(entity.to_dict()), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@entities_bp.route('/api/entities/<int:entity_id>', methods=['GET'])
@require_login
def get_entity(entity_id):
    try:
        with get_db() as db:
            entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
            if not entity:
                return jsonify({"error": "Not found"}), 404

            result = entity.to_dict()
            result['recent_signals'] = [
                s.to_dict() for s in db.query(models.Signal)
                .filter(models.Signal.entity_id == entity_id)
                .order_by(models.Signal.created_at.desc()).limit(10).all()
            ]
            result['people_count'] = db.query(models.Person).filter(
                models.Person.entity_id == entity_id,
                models.Person.status == 'active'
            ).count()
            return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@entities_bp.route('/api/entities/<int:entity_id>', methods=['PUT'])
@require_login
def update_entity(entity_id):
    try:
        data = request.json or {}
        with get_db() as db:
            entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
            if not entity:
                return jsonify({"error": "Not found"}), 404

            for field in ['name', 'entity_type', 'website', 'description', 'headquarters',
                          'employee_count', 'funding_stage', 'industry', 'primary_use_cases',
                          'known_clients', 'products', 'distyl_exposure', 'threat_level', 'status']:
                if field in data:
                    setattr(entity, field, data[field])

            entity.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(entity)
            return jsonify(entity.to_dict())

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@entities_bp.route('/api/entities/<int:entity_id>', methods=['DELETE'])
@require_login
def archive_entity(entity_id):
    try:
        with get_db() as db:
            entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
            if not entity:
                return jsonify({"error": "Not found"}), 404
            entity.status = 'archived'
            entity.updated_at = datetime.utcnow()
            db.commit()
            return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@entities_bp.route('/api/entities/stats', methods=['GET'])
@require_login
def entity_stats():
    try:
        with get_db() as db:
            total = db.query(models.Entity).filter(models.Entity.status == 'active').count()
            by_type = {}
            for t in ['competitor', 'target', 'partner']:
                by_type[t] = db.query(models.Entity).filter(
                    models.Entity.entity_type == t, models.Entity.status == 'active'
                ).count()
            by_threat = {}
            for lvl in ['critical', 'high', 'medium', 'low', 'monitor']:
                by_threat[lvl] = db.query(models.Entity).filter(
                    models.Entity.threat_level == lvl, models.Entity.status == 'active'
                ).count()
            return jsonify({"total": total, "by_type": by_type, "by_threat": by_threat})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
