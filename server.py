"""
Distyl Competitive Intelligence Portal — Flask Backend
Port 5002
"""
import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'distyl-intel-dev-secret-2026')
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"], supports_credentials=True)

# Register blueprints
from routes.auth import auth_bp
from routes.entities import entities_bp
from routes.dossiers import dossiers_bp
from routes.signals import signals_bp
from routes.news_feed import news_bp
from routes.people import people_bp
from routes.pipeline import pipeline_bp
from routes.partnerships import partnerships_bp
from routes.battle_cards import battle_cards_bp
from routes.digests import digests_bp
from routes.slack_webhook import slack_bp
from routes.gmail_webhook import gmail_bp
from routes.chat import chat_bp
from routes.admin import admin_bp

app.register_blueprint(auth_bp)
app.register_blueprint(entities_bp)
app.register_blueprint(dossiers_bp)
app.register_blueprint(signals_bp)
app.register_blueprint(news_bp)
app.register_blueprint(people_bp)
app.register_blueprint(pipeline_bp)
app.register_blueprint(partnerships_bp)
app.register_blueprint(battle_cards_bp)
app.register_blueprint(digests_bp)
app.register_blueprint(slack_bp)
app.register_blueprint(gmail_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(admin_bp)


@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "service": "distyl-intel", "version": "1.0.0"})


def start_background_jobs():
    """Start APScheduler background jobs"""
    try:
        from jobs.scheduler import start_scheduler
        start_scheduler()
        print("✅ Background jobs started")
    except Exception as e:
        print(f"⚠️  Background jobs failed to start: {e}")


if __name__ == '__main__':
    from database import init_db
    import models
    init_db()
    start_background_jobs()
    port = int(os.getenv('PORT', 5002))
    print(f"🧠 Distyl Intel Portal running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')
