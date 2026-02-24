"""News feed routes + SSE stream"""
import json
import time
from flask import Blueprint, request, jsonify, Response, stream_with_context
from database import get_db
import models
from middleware.auth import require_login

news_bp = Blueprint('news', __name__)


@news_bp.route('/api/news', methods=['GET'])
@require_login
def get_news():
    try:
        with get_db() as db:
            query = db.query(models.NewsItem)
            if entity_id := request.args.get('entity_id'):
                query = query.filter(models.NewsItem.entity_id == int(entity_id))
            if source_type := request.args.get('source_type'):
                query = query.filter(models.NewsItem.source_type == source_type)

            total = query.count()
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 50))
            items = query.order_by(models.NewsItem.published_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

            result = []
            for item in items:
                d = item.to_dict()
                entity = db.query(models.Entity).filter(models.Entity.id == item.entity_id).first()
                d['entity_name'] = entity.name if entity else None
                result.append(d)

            return jsonify({"news": result, "total": total, "page": page})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@news_bp.route('/api/news/live')
def news_live():
    """SSE stream for real-time news updates"""
    def generate():
        last_id = 0
        while True:
            try:
                with get_db() as db:
                    items = db.query(models.NewsItem).filter(
                        models.NewsItem.id > last_id
                    ).order_by(models.NewsItem.id.desc()).limit(5).all()

                    for item in reversed(items):
                        last_id = max(last_id, item.id)
                        entity = db.query(models.Entity).filter(models.Entity.id == item.entity_id).first()
                        d = item.to_dict()
                        d['entity_name'] = entity.name if entity else None
                        yield f"data: {json.dumps(d)}\n\n"
            except Exception:
                pass
            time.sleep(30)

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'}
    )


@news_bp.route('/api/news/refresh', methods=['POST'])
@require_login
def refresh_news():
    try:
        entity_id = request.json.get('entity_id')
        if not entity_id:
            return jsonify({"error": "entity_id required"}), 400

        with get_db() as db:
            entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
            if not entity:
                return jsonify({"error": "Entity not found"}), 404

        from jobs.news_refresh import refresh_entity_news
        count = refresh_entity_news(entity_id)
        return jsonify({"success": True, "new_items": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@news_bp.route('/api/news/stats', methods=['GET'])
@require_login
def news_stats():
    try:
        with get_db() as db:
            total = db.query(models.NewsItem).count()
            by_source = {}
            for src in ['newsapi', 'perplexity', 'rss', 'claude_search']:
                by_source[src] = db.query(models.NewsItem).filter(
                    models.NewsItem.source_type == src
                ).count()
            return jsonify({"total": total, "by_source": by_source})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
