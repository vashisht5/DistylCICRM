"""
Gmail push notification receiver via Google Cloud Pub/Sub.

Setup:
1. Create a Pub/Sub topic in GCP: `projects/{project}/topics/gmail-push`
2. Create a push subscription pointing to: https://your-domain/gmail/webhook
3. Grant `gmail-api-push@system.gserviceaccount.com` → Pub/Sub Publisher on the topic
4. Call Gmail API `users.watch` for each connected user to subscribe them to the topic

Each push message from Pub/Sub is base64-encoded JSON:
  { "emailAddress": "user@distyl.ai", "historyId": "12345" }

On receiving a push we:
1. Decode the message
2. Find the user by email
3. Fetch new Gmail messages since last history ID
4. Scan for entity mentions → create Signal + GmailMention records
5. If a deal account is mentioned → immediate Slack alert
"""
import base64
import json
import os
from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db
import models

gmail_bp = Blueprint('gmail', __name__)

PUBSUB_TOKEN = os.getenv('GMAIL_PUBSUB_TOKEN', '')


def _verify_pubsub(req):
    """Verify the request is from Google Pub/Sub (token check)."""
    if not PUBSUB_TOKEN:
        return True  # Skip in dev
    token = req.args.get('token', '')
    return token == PUBSUB_TOKEN


@gmail_bp.route('/gmail/webhook', methods=['POST'])
def gmail_push():
    """Receive Gmail push notifications from Google Pub/Sub."""
    if not _verify_pubsub(request):
        return jsonify({"error": "Unauthorized"}), 401

    try:
        envelope = request.get_json(silent=True) or {}
        message = envelope.get('message', {})
        if not message:
            return jsonify({"ok": True})  # Ack empty messages

        # Decode Pub/Sub message data
        data_b64 = message.get('data', '')
        if not data_b64:
            return jsonify({"ok": True})

        data = json.loads(base64.b64decode(data_b64).decode('utf-8'))
        email = data.get('emailAddress', '')
        history_id = data.get('historyId', '')

        if not email:
            return jsonify({"ok": True})

        # Process in background so we ack Pub/Sub quickly
        import threading
        t = threading.Thread(
            target=_process_gmail_push,
            args=(email, history_id),
            daemon=True
        )
        t.start()

        return jsonify({"ok": True})

    except Exception as e:
        print(f"Gmail webhook error: {e}")
        return jsonify({"ok": True})  # Always ack to avoid retry storms


def _process_gmail_push(email: str, history_id: str):
    """Background: fetch new messages and scan for entity mentions."""
    try:
        with get_db() as db:
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user:
                return

            from integrations.oauth_store import get_token
            token_data = get_token(user.id, 'google')
            if not token_data or not token_data.get('refresh_token'):
                return

            from integrations.gmail_client import get_gmail_service
            service = get_gmail_service(token_data['access_token'], token_data['refresh_token'])
            if not service:
                return

            # Fetch recent unread messages (last 20)
            from integrations.gmail_client import list_messages, get_message
            messages = list_messages(service, max_results=20)

            # Get all tracked entity names for mention scanning
            entities = db.query(models.Entity).filter(models.Entity.status == 'active').all()
            entity_names = {e.id: e.name for e in entities}

            # Get active deal account names for deal alert matching
            deals = db.query(models.Deal).filter(
                models.Deal.stage.notin_(['closed_won', 'closed_lost'])
            ).all()
            deal_accounts = {d.id: d.account_name.lower() for d in deals}

            for msg_meta in messages[:10]:  # Process latest 10
                msg_id = msg_meta.get('id')
                if not msg_id:
                    continue

                # Skip already processed messages
                existing = db.query(models.GmailMention).filter(
                    models.GmailMention.gmail_message_id == msg_id
                ).first()
                if existing:
                    continue

                msg = get_message(service, msg_id)
                if not msg:
                    continue

                subject = msg.get('subject', '')
                sender = msg.get('sender', '')
                body = msg.get('body', '')
                full_text = f"{subject} {body}".lower()

                # Find entity mentions
                mentioned_entities = []
                for eid, ename in entity_names.items():
                    if ename.lower() in full_text:
                        mentioned_entities.append(eid)

                if not mentioned_entities:
                    continue

                # Save GmailMention record
                mention = models.GmailMention(
                    gmail_message_id=msg_id,
                    thread_id=msg_meta.get('threadId', ''),
                    subject=subject,
                    sender=sender,
                    received_at=datetime.utcnow(),
                    entity_mentions=mentioned_entities,
                    processed=True,
                )
                db.add(mention)
                db.flush()

                # Create Signal for each mentioned entity
                signal_ids = []
                for eid in mentioned_entities:
                    signal = models.Signal(
                        entity_id=eid,
                        signal_type='email_mention',
                        title=f"Email mention: {subject or '(no subject)'}",
                        summary=f"From: {sender}. Entity mentioned in email thread.",
                        source_type='gmail',
                        source_name='Gmail',
                        source_date=datetime.utcnow(),
                        ingested_at=datetime.utcnow(),
                        score=55,  # Default score; signal_agent will re-score in sweep
                        status='new',
                        created_at=datetime.utcnow(),
                    )
                    db.add(signal)
                    db.flush()
                    signal_ids.append(signal.id)

                    # Check for deal account match → immediate Slack alert
                    entity_name_lower = entity_names[eid].lower()
                    for did, account_name in deal_accounts.items():
                        if account_name in full_text or entity_name_lower in full_text:
                            _send_deal_alert(entity_names[eid], subject, sender, account_name)
                            break

                mention.signal_ids = signal_ids
                db.commit()

    except Exception as e:
        print(f"Gmail push processing error: {e}")


def _send_deal_alert(entity_name: str, subject: str, sender: str, account_name: str):
    """Post immediate Slack alert for deal-account email mention."""
    try:
        from integrations.slack_client import SlackClient
        slack = SlackClient()
        slack.post_message(
            channel=os.getenv('SLACK_INTEL_CHANNEL', '#competitive-intel'),
            text=f"📧 Deal alert: {entity_name} mentioned in email re: {account_name}",
            blocks=[
                {"type": "header", "text": {"type": "plain_text", "text": f"📧 Deal Alert: {entity_name}"}},
                {"type": "section", "text": {"type": "mrkdwn",
                    "text": f"*Account:* {account_name}\n*Subject:* {subject}\n*From:* {sender}"}},
            ]
        )
    except Exception as e:
        print(f"Slack deal alert error: {e}")


@gmail_bp.route('/gmail/setup-watch', methods=['POST'])
def setup_gmail_watch():
    """
    Register Gmail push notifications for the current user.
    Call this after the user connects their Gmail via OAuth.
    Requires GMAIL_PUBSUB_TOPIC env var: projects/{project}/topics/{topic}
    """
    from flask import session
    user_session = session.get('user')
    if not user_session:
        return jsonify({"error": "Not authenticated"}), 401

    topic = os.getenv('GMAIL_PUBSUB_TOPIC', '')
    if not topic:
        return jsonify({"error": "GMAIL_PUBSUB_TOPIC not configured"}), 400

    try:
        from integrations.oauth_store import get_token
        token_data = get_token(user_session['id'], 'google')
        if not token_data:
            return jsonify({"error": "No Google token found. Connect Gmail first."}), 400

        from integrations.gmail_client import get_gmail_service
        service = get_gmail_service(token_data['access_token'], token_data['refresh_token'])

        result = service.users().watch(
            userId='me',
            body={
                'topicName': topic,
                'labelIds': ['INBOX'],
                'labelFilterAction': 'include',
            }
        ).execute()

        return jsonify({"ok": True, "history_id": result.get('historyId'), "expiration": result.get('expiration')})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
