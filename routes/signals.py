"""Signals feed"""
from flask import Blueprint, request, jsonify
from database import get_db
import models
from middleware.auth import require_login

signals_bp = Blueprint('signals', __name__)


@signals_bp.route('/api/signals', methods=['GET'])
@require_login
def get_signals():
    try:
        with get_db() as db:
            query = db.query(models.Signal)
            if entity_id := request.args.get('entity_id'):
                query = query.filter(models.Signal.entity_id == int(entity_id))
            if signal_type := request.args.get('signal_type'):
                query = query.filter(models.Signal.signal_type == signal_type)
            if status := request.args.get('status'):
                query = query.filter(models.Signal.status == status)
            if min_score := request.args.get('min_score'):
                query = query.filter(models.Signal.score >= int(min_score))

            total = query.count()
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 50))
            signals = query.order_by(models.Signal.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

            result = []
            for s in signals:
                d = s.to_dict()
                entity = db.query(models.Entity).filter(models.Entity.id == s.entity_id).first()
                d['entity_name'] = entity.name if entity else None
                d['entity_type'] = entity.entity_type if entity else None
                result.append(d)

            return jsonify({"signals": result, "total": total, "page": page})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@signals_bp.route('/api/signals/<int:signal_id>/review', methods=['POST'])
@require_login
def review_signal(signal_id):
    try:
        with get_db() as db:
            signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
            if not signal:
                return jsonify({"error": "Not found"}), 404
            signal.status = 'reviewed'
            db.commit()
            return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@signals_bp.route('/api/signals/stats', methods=['GET'])
@require_login
def signal_stats():
    try:
        with get_db() as db:
            total_new = db.query(models.Signal).filter(models.Signal.status == 'new').count()
            high_score = db.query(models.Signal).filter(
                models.Signal.score >= 80, models.Signal.status == 'new'
            ).count()
            by_type = {}
            for t in ['news', 'product_launch', 'exec_change', 'hiring', 'partnership', 'funding', 'customer_win']:
                by_type[t] = db.query(models.Signal).filter(
                    models.Signal.signal_type == t, models.Signal.status == 'new'
                ).count()
            return jsonify({"total_new": total_new, "high_score": high_score, "by_type": by_type})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
