"""Ecosystem / partnership map"""
from flask import Blueprint, request, jsonify
from database import get_db
import models
from middleware.auth import require_login

partnerships_bp = Blueprint('partnerships', __name__)


@partnerships_bp.route('/api/partnerships', methods=['GET'])
@require_login
def get_partnerships():
    try:
        with get_db() as db:
            partnerships = db.query(models.Partnership).all()
            result = []
            for p in partnerships:
                d = p.to_dict()
                ea = db.query(models.Entity).filter(models.Entity.id == p.entity_a_id).first()
                eb = db.query(models.Entity).filter(models.Entity.id == p.entity_b_id).first()
                d['entity_a_name'] = ea.name if ea else None
                d['entity_a_type'] = ea.entity_type if ea else None
                d['entity_b_name'] = eb.name if eb else None
                d['entity_b_type'] = eb.entity_type if eb else None
                result.append(d)
            return jsonify({"partnerships": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@partnerships_bp.route('/api/partnerships', methods=['POST'])
@require_login
def create_partnership():
    try:
        data = request.json or {}
        with get_db() as db:
            p = models.Partnership(
                entity_a_id=data['entity_a_id'],
                entity_b_id=data['entity_b_id'],
                partnership_type=data.get('partnership_type'),
                description=data.get('description'),
                source_url=data.get('source_url'),
                strength=data.get('strength', 'surface'),
            )
            db.add(p)
            db.commit()
            db.refresh(p)
            return jsonify(p.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@partnerships_bp.route('/api/partnerships/graph', methods=['GET'])
@require_login
def partnership_graph():
    """Return graph nodes + edges for xyflow visualization"""
    try:
        with get_db() as db:
            entities = db.query(models.Entity).filter(models.Entity.status == 'active').all()
            partnerships = db.query(models.Partnership).all()

            nodes = []
            for e in entities:
                color = {'competitor': '#ef4444', 'target': '#3b82f6', 'partner': '#22c55e'}.get(e.entity_type, '#6b7280')
                nodes.append({
                    "id": str(e.id),
                    "data": {"label": e.name, "entity_type": e.entity_type, "threat_level": e.threat_level},
                    "position": {"x": 0, "y": 0},
                    "style": {"background": color, "color": "#fff", "border": "none"}
                })

            edges = []
            for p in partnerships:
                edges.append({
                    "id": f"e{p.id}",
                    "source": str(p.entity_a_id),
                    "target": str(p.entity_b_id),
                    "label": p.partnership_type,
                    "data": {"strength": p.strength}
                })

            return jsonify({"nodes": nodes, "edges": edges})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
