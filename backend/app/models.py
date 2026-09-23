from __future__ import annotations

from datetime import datetime, timezone

from .extensions import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(320), unique=True, nullable=False)
    username = db.Column(db.String(32), unique=True, nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class OAuthAccount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    provider = db.Column(db.String(32), nullable=False)
    provider_user_id = db.Column(db.String(255), nullable=False)
    user = db.relationship("User", backref=db.backref("oauth_accounts", lazy=True))

    __table_args__ = (db.UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_user"),)


class Mission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(32), unique=True, nullable=False)
    title = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=False)
    order_index = db.Column(db.Integer, nullable=False, unique=True)


class MissionProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    mission_id = db.Column(db.Integer, db.ForeignKey("mission.id"), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="in_progress")
    resources = db.Column(db.JSON, nullable=False, default=dict)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (db.UniqueConstraint("user_id", "mission_id", name="uq_user_mission_progress"),)


class Decision(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    mission_id = db.Column(db.Integer, db.ForeignKey("mission.id"), nullable=False)
    key = db.Column(db.String(100), nullable=False)
    value = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Sample(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sample_code = db.Column(db.String(40), nullable=False, unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    mission_id = db.Column(db.Integer, db.ForeignKey("mission.id"), nullable=False)
    sample_type = db.Column(db.String(64), nullable=False)
    mass = db.Column(db.Float, nullable=False)
    coord_x = db.Column(db.Float, nullable=False)
    coord_y = db.Column(db.Float, nullable=False)
    coord_z = db.Column(db.Float, nullable=False)
    composition = db.Column(db.JSON, nullable=False, default=dict)
    status = db.Column(db.String(20), nullable=False, default="collected")
    scientific_value = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class InventoryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    mission_id = db.Column(db.Integer, db.ForeignKey("mission.id"), nullable=False)
    item_key = db.Column(db.String(64), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)


class ScientificData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    mission_id = db.Column(db.Integer, db.ForeignKey("mission.id"), nullable=False)
    sample_id = db.Column(db.Integer, db.ForeignKey("sample.id"), nullable=True)
    payload = db.Column(db.JSON, nullable=False, default=dict)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class MissionResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    mission_id = db.Column(db.Integer, db.ForeignKey("mission.id"), nullable=False)
    score = db.Column(db.Integer, nullable=False, default=0)
    summary = db.Column(db.Text, nullable=False, default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class PlayerStatistics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, unique=True, index=True)
    completed_missions = db.Column(db.Integer, nullable=False, default=0)
    samples_collected = db.Column(db.Integer, nullable=False, default=0)
    distance_traveled = db.Column(db.Float, nullable=False, default=0.0)
    time_played = db.Column(db.Integer, nullable=False, default=0)
    mission_stats = db.Column(db.JSON, nullable=False, default=dict)
