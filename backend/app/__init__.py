import os

from dotenv import load_dotenv
from flask import Flask

from .extensions import db, migrate
from .routes.api import api_bp
from .seed import seed_missions


def create_app(test_config: dict | None = None) -> Flask:
    load_dotenv()
    app = Flask(__name__)

    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-secret-change-me"),
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL", "sqlite:///space_mission.db"),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true",
        USERNAME_MIN_LEN=int(os.getenv("USERNAME_MIN_LEN", "3")),
        USERNAME_MAX_LEN=int(os.getenv("USERNAME_MAX_LEN", "16")),
        RESERVED_USERNAMES=["admin", "root", "system", "nasa", "mission-control"],
    )

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(api_bp)

    with app.app_context():
        db.create_all()
        seed_missions()

    return app
