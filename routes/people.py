"""People / exec tracker"""
from flask import Blueprint, request, jsonify
from database import get_db
import models
from middleware.auth import require_login

people_bp = Blueprint('people', __name__)


@people_bp.route('/api/people', methods=['GET'])
@require_login
def get_people():
    try:
        with get_db() as db:
            query = db.query(models.Person).filter(models.Person.status == 'active')
            if entity_id := request.args.get('entity_id'):
                query = query.filter(models.Person.entity_id == int(entity_id))
            if person_type := request.args.get('person_type'):
                query = query.filter(models.Person.person_type == person_type)

            people = query.order_by(models.Person.last_name).all()
            result = []
            for p in people:
                d = p.to_dict()
                entity = db.query(models.Entity).filter(models.Entity.id == p.entity_id).first()
                d['entity_name'] = entity.name if entity else None
                movements = db.query(models.PersonMovement).filter(
                    models.PersonMovement.person_id == p.id
                ).order_by(models.PersonMovement.detected_at.desc()).limit(3).all()
                d['movements'] = [m.to_dict() for m in movements]
                result.append(d)

            return jsonify({"people": result, "total": len(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@people_bp.route('/api/people', methods=['POST'])
@require_login
def create_person():
    try:
        data = request.json or {}
        if not data.get('entity_id'):
            return jsonify({"error": "entity_id required"}), 400
        with get_db() as db:
            person = models.Person(
                entity_id=data['entity_id'],
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                title=data.get('title'),
                current_company=data.get('current_company'),
                previous_companies=data.get('previous_companies'),
                linkedin_url=data.get('linkedin_url'),
                email=data.get('email'),
                person_type=data.get('person_type', 'executive'),
                distyl_relationship=data.get('distyl_relationship', 'unknown'),
                notes=data.get('notes'),
            )
            db.add(person)
            db.commit()
            db.refresh(person)
            return jsonify(person.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@people_bp.route('/api/people/<int:person_id>', methods=['PUT'])
@require_login
def update_person(person_id):
    try:
        data = request.json or {}
        with get_db() as db:
            person = db.query(models.Person).filter(models.Person.id == person_id).first()
            if not person:
                return jsonify({"error": "Not found"}), 404
            for field in ['first_name', 'last_name', 'title', 'current_company', 'linkedin_url',
                          'email', 'person_type', 'distyl_relationship', 'notes', 'status']:
                if field in data:
                    setattr(person, field, data[field])
            db.commit()
            return jsonify(person.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
