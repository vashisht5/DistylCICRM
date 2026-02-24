"""Deal pipeline + competitive overlay"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from database import get_db
import models
from middleware.auth import require_login

pipeline_bp = Blueprint('pipeline', __name__)


@pipeline_bp.route('/api/deals', methods=['GET'])
@require_login
def get_deals():
    try:
        with get_db() as db:
            query = db.query(models.Deal)
            if stage := request.args.get('stage'):
                query = query.filter(models.Deal.stage == stage)

            deals = query.order_by(models.Deal.created_at.desc()).all()
            result = []
            for deal in deals:
                d = deal.to_dict()
                d['competitors'] = []
                for dc in db.query(models.DealCompetitor).filter(models.DealCompetitor.deal_id == deal.id).all():
                    entity = db.query(models.Entity).filter(models.Entity.id == dc.entity_id).first()
                    dc_dict = dc.to_dict()
                    dc_dict['entity_name'] = entity.name if entity else None
                    dc_dict['threat_level'] = entity.threat_level if entity else None
                    d['competitors'].append(dc_dict)
                result.append(d)
            return jsonify({"deals": result, "total": len(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pipeline_bp.route('/api/deals', methods=['POST'])
@require_login
def create_deal():
    try:
        data = request.json or {}
        if not data.get('account_name'):
            return jsonify({"error": "account_name required"}), 400
        with get_db() as db:
            deal = models.Deal(
                account_name=data['account_name'],
                deal_name=data.get('deal_name'),
                stage=data.get('stage', 'prospecting'),
                value_usd=data.get('value_usd'),
                owner=data.get('owner'),
                distyl_product=data.get('distyl_product'),
            )
            db.add(deal)
            db.commit()
            db.refresh(deal)
            return jsonify(deal.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pipeline_bp.route('/api/deals/<int:deal_id>', methods=['GET'])
@require_login
def get_deal(deal_id):
    try:
        with get_db() as db:
            deal = db.query(models.Deal).filter(models.Deal.id == deal_id).first()
            if not deal:
                return jsonify({"error": "Not found"}), 404
            d = deal.to_dict()
            d['competitors'] = []
            for dc in db.query(models.DealCompetitor).filter(models.DealCompetitor.deal_id == deal_id).all():
                entity = db.query(models.Entity).filter(models.Entity.id == dc.entity_id).first()
                dc_dict = dc.to_dict()
                dc_dict['entity_name'] = entity.name if entity else None
                d['competitors'].append(dc_dict)
            return jsonify(d)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pipeline_bp.route('/api/deals/<int:deal_id>', methods=['PUT'])
@require_login
def update_deal(deal_id):
    try:
        data = request.json or {}
        with get_db() as db:
            deal = db.query(models.Deal).filter(models.Deal.id == deal_id).first()
            if not deal:
                return jsonify({"error": "Not found"}), 404
            for field in ['account_name', 'deal_name', 'stage', 'value_usd', 'owner',
                          'distyl_product', 'win_loss_status', 'loss_reason']:
                if field in data:
                    setattr(deal, field, data[field])
            deal.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(deal)
            return jsonify(deal.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pipeline_bp.route('/api/deals/<int:deal_id>/competitors', methods=['POST'])
@require_login
def add_deal_competitor(deal_id):
    try:
        data = request.json or {}
        with get_db() as db:
            dc = models.DealCompetitor(
                deal_id=deal_id,
                entity_id=data['entity_id'],
                involvement=data.get('involvement', 'shortlisted'),
                source=data.get('source'),
            )
            db.add(dc)
            db.commit()
            return jsonify(dc.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pipeline_bp.route('/api/deals/competitive-map', methods=['GET'])
@require_login
def competitive_map():
    """Matrix of active deals × competitors"""
    try:
        with get_db() as db:
            deals = db.query(models.Deal).filter(
                models.Deal.stage.notin_(['closed_won', 'closed_lost'])
            ).all()
            competitors = db.query(models.Entity).filter(
                models.Entity.entity_type == 'competitor',
                models.Entity.status == 'active'
            ).all()

            matrix = []
            for deal in deals:
                row = {
                    "deal_id": deal.id,
                    "account_name": deal.account_name,
                    "stage": deal.stage,
                    "distyl_product": deal.distyl_product,
                    "competitors": {}
                }
                for comp in competitors:
                    dc = db.query(models.DealCompetitor).filter(
                        models.DealCompetitor.deal_id == deal.id,
                        models.DealCompetitor.entity_id == comp.id
                    ).first()
                    row["competitors"][comp.name] = dc.involvement if dc else None
                matrix.append(row)

            return jsonify({
                "matrix": matrix,
                "competitors": [{"id": c.id, "name": c.name, "threat_level": c.threat_level} for c in competitors]
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
