"""Natural language chat interface"""
from flask import Blueprint, request, jsonify
from middleware.auth import require_login

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/api/chat', methods=['POST'])
@require_login
def chat():
    try:
        data = request.json or {}
        message = data.get('message', '').strip()
        history = data.get('history', [])

        if not message:
            return jsonify({"error": "message required"}), 400

        from ai.chat_agent import ChatAgent
        agent = ChatAgent()
        response = agent.chat(message, history)
        return jsonify({"response": response, "message": message})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
