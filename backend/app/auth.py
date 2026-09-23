import re
from functools import wraps

from flask import current_app, jsonify, session

from .extensions import db
from .models import PlayerStatistics, User

USERNAME_REGEX = re.compile(r"^[A-Za-z0-9_]+$")


def get_current_user() -> User | None:
    user_id = session.get("user_id")
    if not user_id:
        return None
    return db.session.get(User, user_id)


def login_user(user: User) -> None:
    session["user_id"] = user.id


def logout_user() -> None:
    session.clear()


def username_rules() -> tuple[int, int, set[str]]:
    return (
        current_app.config["USERNAME_MIN_LEN"],
        current_app.config["USERNAME_MAX_LEN"],
        set(current_app.config["RESERVED_USERNAMES"]),
    )


def validate_username(username: str) -> str | None:
    min_len, max_len, reserved = username_rules()
    candidate = (username or "").strip()
    if not (min_len <= len(candidate) <= max_len):
        return f"Username debe tener entre {min_len} y {max_len} caracteres."
    if not USERNAME_REGEX.fullmatch(candidate):
        return "Username solo permite letras, números y guion bajo (_)."
    if candidate.lower() in {r.lower() for r in reserved}:
        return "Este nombre de usuario está reservado."
    return None


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "UNAUTHORIZED"}), 401
        return fn(user, *args, **kwargs)

    return wrapper


def ensure_player_stats(user_id: int) -> None:
    if not PlayerStatistics.query.filter_by(user_id=user_id).first():
        db.session.add(PlayerStatistics(user_id=user_id))
        db.session.commit()
