"""Slack slash commands and event webhooks"""
import os
import hmac
import hashlib
import time
from flask import Blueprint, request, jsonify
from database import get_db
import models

slack_bp = Blueprint('slack', __name__)
SLACK_SIGNING_SECRET = os.getenv('SLACK_SIGNING_SECRET', '')


def verify_slack_signature(req):
    """Verify Slack request signature"""
    if not SLACK_SIGNING_SECRET:
        return True  # Skip in dev
    timestamp = req.headers.get('X-Slack-Request-Timestamp', '')
    if not timestamp or abs(time.time() - int(timestamp)) > 300:
        return False
    sig_base = f"v0:{timestamp}:{req.get_data(as_text=True)}"
    expected = 'v0=' + hmac.new(
        SLACK_SIGNING_SECRET.encode(), sig_base.encode(), hashlib.sha256
    ).hexdigest()  # hmac.new is valid in Python stdlib
    return hmac.compare_digest(expected, req.headers.get('X-Slack-Signature', ''))


@slack_bp.route('/slack/commands', methods=['POST'])
def slack_commands():
    """Handle /intel /brief /signals /deal slash commands"""
    try:
        command = request.form.get('command', '')
        text = request.form.get('text', '').strip()

        if command == '/intel':
            return handle_intel(text)
        elif command == '/signals':
            return handle_signals(text)
        elif command == '/deal':
            return handle_deal(text)
        elif command == '/brief':
            return handle_brief(text)
        else:
            return jsonify({"response_type": "ephemeral", "text": f"Unknown command: {command}"})
    except Exception as e:
        return jsonify({"response_type": "ephemeral", "text": f"Error: {str(e)}"})


def handle_intel(entity_name):
    if not entity_name:
        return jsonify({"response_type": "ephemeral", "text": "Usage: /intel [company name]"})

    with get_db() as db:
        entity = db.query(models.Entity).filter(
            models.Entity.name.ilike(f'%{entity_name}%')
        ).first()
        if not entity:
            return jsonify({"response_type": "ephemeral", "text": f"No entity found matching '{entity_name}'"})

        latest = db.query(models.Dossier).filter(
            models.Dossier.entity_id == entity.id,
            models.Dossier.generation_status == 'completed'
        ).order_by(models.Dossier.generated_at.desc()).first()

        synopsis = (latest.section_a_synopsis[:800] if latest and latest.section_a_synopsis
                    else entity.description or "No dossier available yet.")

        blocks = [
            {"type": "header", "text": {"type": "plain_text", "text": f"Intel: {entity.name}"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": synopsis}},
            {"type": "context", "elements": [
                {"type": "mrkdwn", "text": f"Threat: *{entity.threat_level}* | Exposure: *{entity.distyl_exposure}* | Type: *{entity.entity_type}*"}
            ]}
        ]
        return jsonify({"response_type": "in_channel", "blocks": blocks})


def handle_signals(entity_name):
    if not entity_name:
        return jsonify({"response_type": "ephemeral", "text": "Usage: /signals [company name]"})

    with get_db() as db:
        entity = db.query(models.Entity).filter(models.Entity.name.ilike(f'%{entity_name}%')).first()
        if not entity:
            return jsonify({"response_type": "ephemeral", "text": f"No entity found matching '{entity_name}'"})

        signals = db.query(models.Signal).filter(
            models.Signal.entity_id == entity.id
        ).order_by(models.Signal.created_at.desc()).limit(5).all()

        blocks = [{"type": "header", "text": {"type": "plain_text", "text": f"Latest signals: {entity.name}"}}]
        for s in signals:
            date_str = s.source_date.strftime('%b %d') if s.source_date else 'n/a'
            blocks.append({"type": "section", "text": {"type": "mrkdwn",
                "text": f"*[{s.score}]* {s.title}\n_{s.source_name}_ · {date_str}"}})

        if not signals:
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": "_No signals found_"}})

        return jsonify({"response_type": "in_channel", "blocks": blocks})


def handle_deal(account_name):
    if not account_name:
        return jsonify({"response_type": "ephemeral", "text": "Usage: /deal [account name]"})

    with get_db() as db:
        deal = db.query(models.Deal).filter(
            models.Deal.account_name.ilike(f'%{account_name}%')
        ).first()
        if not deal:
            return jsonify({"response_type": "ephemeral", "text": f"No deal found for '{account_name}'"})

        comps = db.query(models.DealCompetitor).filter(models.DealCompetitor.deal_id == deal.id).all()
        lines = [f"*{deal.account_name}* — Stage: `{deal.stage}` | Product: `{deal.distyl_product or 'TBD'}`"]
        for c in comps:
            ent = db.query(models.Entity).filter(models.Entity.id == c.entity_id).first()
            lines.append(f"• {ent.name if ent else '?'}: _{c.involvement}_")
        if not comps:
            lines.append("_No competitors identified yet_")

        return jsonify({"response_type": "in_channel", "text": '\n'.join(lines)})


def handle_brief(text):
    parts = [p.strip() for p in text.split(' vs ')]
    if len(parts) == 2:
        return jsonify({
            "response_type": "in_channel",
            "text": f"Brief: _{parts[0]}_ vs _{parts[1]}_ — Use the Distyl Intel portal for full battle card comparison."
        })
    return jsonify({"response_type": "ephemeral", "text": "Usage: /brief [Company A] vs [Company B]"})


@slack_bp.route('/slack/events', methods=['POST'])
def slack_events():
    """Handle Slack event subscriptions"""
    data = request.json or {}
    # URL verification challenge
    if data.get('type') == 'url_verification':
        return jsonify({"challenge": data.get('challenge')})
    # Future: handle reaction events for feedback loop
    return jsonify({"ok": True})
