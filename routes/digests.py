"""Bi-weekly digest routes"""
from flask import Blueprint, request, jsonify
from database import get_db
import models
from middleware.auth import require_login

digests_bp = Blueprint('digests', __name__)


@digests_bp.route('/api/digests', methods=['GET'])
@require_login
def get_digests():
    try:
        with get_db() as db:
            digests = db.query(models.Digest).order_by(models.Digest.generated_at.desc()).limit(20).all()
            return jsonify({"digests": [d.to_dict() for d in digests]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@digests_bp.route('/api/digests/<int:digest_id>', methods=['GET'])
@require_login
def get_digest(digest_id):
    try:
        with get_db() as db:
            d = db.query(models.Digest).filter(models.Digest.id == digest_id).first()
            if not d:
                return jsonify({"error": "Not found"}), 404
            return jsonify(d.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@digests_bp.route('/api/digests/generate', methods=['POST'])
@require_login
def generate_digest():
    try:
        import threading
        from ai.digest_agent import DigestAgent
        agent = DigestAgent()
        threading.Thread(target=agent.generate, daemon=True).start()
        return jsonify({"success": True, "message": "Digest generation started"}), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@digests_bp.route('/api/digests/<int:digest_id>/post-slack', methods=['POST'])
@require_login
def post_digest_to_slack(digest_id):
    try:
        with get_db() as db:
            digest = db.query(models.Digest).filter(models.Digest.id == digest_id).first()
            if not digest:
                return jsonify({"error": "Not found"}), 404

            from integrations.slack_client import SlackClient
            from datetime import datetime
            slack = SlackClient()
            text = f"*{digest.subject}*\n\n{digest.content.get('headline', '')}" if digest.content else digest.subject
            ts = slack.post_message('#competitive-intel', text)

            digest.slack_posted = True
            digest.slack_ts = ts
            digest.posted_at = datetime.utcnow()
            db.commit()

            return jsonify({"success": True, "slack_ts": ts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
