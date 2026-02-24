"""
Auth middleware — @require_login, @require_role decorators
"""
from functools import wraps
from flask import session, jsonify


def get_current_user():
    """Get current user from session"""
    return session.get('user')


def require_login(f):
    """Decorator: require authenticated session"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Decorator: require specific role(s).
    Usage: @require_role('admin') or @require_role('admin', 'analyst')
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Authentication required"}), 401
            if user.get('role') not in roles:
                return jsonify({"error": f"Role required: {', '.join(roles)}"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def can_write():
    """Check if current user can write (admin, analyst)"""
    user = get_current_user()
    if not user:
        return False
    return user.get('role') in ('admin', 'analyst')


def can_admin():
    """Check if current user is admin"""
    user = get_current_user()
    if not user:
        return False
    return user.get('role') == 'admin'
