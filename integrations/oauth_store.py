"""
Per-user OAuth token persistence.
Wraps the OAuthToken model for easy read/write of Google + Slack tokens.
"""
from datetime import datetime
from database import get_db
import models


def save_token(user_id: int, provider: str, access_token: str,
               refresh_token: str = None, scopes: list = None, expires_at=None):
    """Upsert an OAuth token for a user+provider pair."""
    with get_db() as db:
        token = db.query(models.OAuthToken).filter(
            models.OAuthToken.user_id == user_id,
            models.OAuthToken.provider == provider
        ).first()

        if token:
            token.access_token = access_token
            if refresh_token:
                token.refresh_token = refresh_token
            if scopes is not None:
                token.scopes = scopes
            if expires_at:
                token.expires_at = expires_at
            token.updated_at = datetime.utcnow()
        else:
            token = models.OAuthToken(
                user_id=user_id,
                provider=provider,
                access_token=access_token,
                refresh_token=refresh_token,
                scopes=scopes or [],
                expires_at=expires_at,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(token)
        db.commit()


def get_token(user_id: int, provider: str) -> dict | None:
    """Return token dict for user+provider, or None if not found."""
    with get_db() as db:
        token = db.query(models.OAuthToken).filter(
            models.OAuthToken.user_id == user_id,
            models.OAuthToken.provider == provider
        ).first()
        if not token:
            return None
        return {
            "access_token": token.access_token,
            "refresh_token": token.refresh_token,
            "scopes": token.scopes or [],
            "expires_at": token.expires_at,
        }


def get_all_google_tokens() -> list[dict]:
    """Return all users with valid Google tokens (for Gmail/Drive sweeps)."""
    with get_db() as db:
        tokens = db.query(models.OAuthToken).filter(
            models.OAuthToken.provider == 'google',
            models.OAuthToken.refresh_token.isnot(None)
        ).all()
        return [
            {
                "user_id": t.user_id,
                "access_token": t.access_token,
                "refresh_token": t.refresh_token,
                "scopes": t.scopes or [],
            }
            for t in tokens
        ]


def delete_token(user_id: int, provider: str):
    """Remove a token (e.g. on revoke/disconnect)."""
    with get_db() as db:
        db.query(models.OAuthToken).filter(
            models.OAuthToken.user_id == user_id,
            models.OAuthToken.provider == provider
        ).delete()
        db.commit()
