"""
Auth routes — Google OAuth 2.0 SSO for @distyl.ai
"""
import os
from flask import Blueprint, request, jsonify, session, redirect
from datetime import datetime
from database import get_db
import models

auth_bp = Blueprint('auth', __name__)

ALLOWED_DOMAIN = os.getenv('ALLOWED_EMAIL_DOMAIN', 'distyl.ai')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')


@auth_bp.route('/auth/google')
def google_login():
    """Redirect to Google OAuth"""
    try:
        from integrations.google_oauth import get_auth_url
        auth_url, state = get_auth_url()
        session['oauth_state'] = state
        return redirect(auth_url)
    except Exception as e:
        return redirect(f"{FRONTEND_URL}/login?error={str(e)}")


@auth_bp.route('/auth/google/callback')
def google_callback():
    """Handle Google OAuth callback"""
    try:
        from integrations.google_oauth import exchange_code
        code = request.args.get('code')
        if not code:
            return redirect(f"{FRONTEND_URL}/login?error=no_code")

        user_info, tokens = exchange_code(code)
        email = user_info.get('email', '')

        # Domain check (skip in dev if domain is 'any')
        if ALLOWED_DOMAIN != 'any' and not email.endswith(f'@{ALLOWED_DOMAIN}'):
            return redirect(f"{FRONTEND_URL}/login?error=domain_not_allowed")

        with get_db() as db:
            user = db.query(models.User).filter(models.User.google_id == user_info['id']).first()
            if not user:
                user = db.query(models.User).filter(models.User.email == email).first()

            if not user:
                user = models.User(
                    email=email,
                    name=user_info.get('name', email),
                    google_id=user_info['id'],
                    picture_url=user_info.get('picture'),
                    role='analyst',
                    created_at=datetime.utcnow()
                )
                db.add(user)
                db.flush()
            else:
                user.google_id = user_info['id']
                user.name = user_info.get('name', user.name)
                user.picture_url = user_info.get('picture', user.picture_url)

            user.last_login = datetime.utcnow()
            db.flush()

            # Store OAuth tokens
            existing = db.query(models.OAuthToken).filter(
                models.OAuthToken.user_id == user.id,
                models.OAuthToken.provider == 'google'
            ).first()

            if existing:
                existing.access_token = tokens.get('access_token')
                if tokens.get('refresh_token'):
                    existing.refresh_token = tokens.get('refresh_token')
                existing.updated_at = datetime.utcnow()
            else:
                token = models.OAuthToken(
                    user_id=user.id,
                    provider='google',
                    access_token=tokens.get('access_token'),
                    refresh_token=tokens.get('refresh_token'),
                    scopes=tokens.get('scope', '').split(),
                )
                db.add(token)

            db.commit()

            session['user'] = {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'picture_url': user.picture_url,
                'role': user.role,
            }
            session.permanent = True

        return redirect(f"{FRONTEND_URL}/?auth=success")

    except Exception as e:
        print(f"OAuth callback error: {e}")
        return redirect(f"{FRONTEND_URL}/login?error=auth_failed")


@auth_bp.route('/auth/logout', methods=['POST', 'GET'])
def logout():
    session.clear()
    return redirect(f"{FRONTEND_URL}/login")


@auth_bp.route('/auth/me')
def me():
    user = session.get('user')
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify(user)


@auth_bp.route('/auth/dev-login', methods=['POST'])
def dev_login():
    """Development-only bypass login"""
    if os.getenv('FLASK_ENV') == 'production':
        return jsonify({"error": "Not available in production"}), 403

    data = request.json or {}
    email = data.get('email', 'dev@distyl.ai')
    role = data.get('role', 'admin')
    name = data.get('name', f'Dev {role.capitalize()}')

    # Persist to DB so admin/users and other user-linked features work
    with get_db() as db:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                email=email,
                name=name,
                role=role,
                last_login=datetime.utcnow(),
                created_at=datetime.utcnow(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.role = role
            user.last_login = datetime.utcnow()
            db.commit()
            db.refresh(user)

        session['user'] = {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'picture_url': user.picture_url,
            'role': user.role,
        }
    return jsonify(session['user'])
