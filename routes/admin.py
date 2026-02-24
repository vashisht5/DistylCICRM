"""Admin routes — user management (Admin role only)"""
from flask import Blueprint, request, jsonify
from database import get_db
import models
from middleware.auth import require_role

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/api/admin/users', methods=['GET'])
@require_role('admin')
def list_users():
    try:
        with get_db() as db:
            users = db.query(models.User).order_by(models.User.created_at.desc()).all()
            return jsonify({"users": [u.to_dict() for u in users]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@require_role('admin')
def update_user_role(user_id):
    try:
        data = request.json or {}
        new_role = data.get('role')
        if new_role not in ('admin', 'analyst', 'sales', 'viewer'):
            return jsonify({"error": "Invalid role. Must be: admin, analyst, sales, or viewer"}), 400
        with get_db() as db:
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if not user:
                return jsonify({"error": "User not found"}), 404
            user.role = new_role
            db.commit()
            return jsonify(user.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/api/admin/stats', methods=['GET'])
@require_role('admin')
def admin_stats():
    try:
        with get_db() as db:
            return jsonify({
                "users": db.query(models.User).count(),
                "entities": db.query(models.Entity).filter(models.Entity.status == 'active').count(),
                "signals": db.query(models.Signal).filter(models.Signal.status == 'new').count(),
                "dossiers": db.query(models.Dossier).filter(models.Dossier.generation_status == 'completed').count(),
                "deals": db.query(models.Deal).count(),
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
