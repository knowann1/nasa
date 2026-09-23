from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from ..auth import auth_required, ensure_player_stats, login_user, logout_user, validate_username
from ..extensions import db
from ..models import (
    Decision,
    InventoryItem,
    Mission,
    MissionProgress,
    MissionResult,
    OAuthAccount,
    PlayerStatistics,
    Sample,
    ScientificData,
    User,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")
ALLOWED_PROVIDERS = {"google", "apple", "github"}


def completed_mission_ids(user_id: int) -> set[int]:
    rows = MissionResult.query.filter_by(user_id=user_id).all()
    return {row.mission_id for row in rows}


def mission_status_for_user(user_id: int, mission: Mission, completed: set[int] | None = None) -> str:
    completed_set = completed if completed is not None else completed_mission_ids(user_id)
    if mission.id in completed_set:
        return "COMPLETED"
    if mission.order_index == 1:
        return "AVAILABLE"
    required_prev = Mission.query.filter_by(order_index=mission.order_index - 1).first()
    if required_prev and required_prev.id in completed_set:
        return "AVAILABLE"
    return "LOCKED"


@api_bp.post("/auth/<provider>")
def auth_provider(provider: str):
    provider = provider.lower()
    if provider not in ALLOWED_PROVIDERS:
        return jsonify({"error": "Provider not supported"}), 400

    body = request.get_json(silent=True) or {}
    provider_user_id = str(body.get("provider_user_id", "")).strip()
    email = str(body.get("email", "")).strip().lower()

    if not provider_user_id or not email:
        return jsonify({"error": "provider_user_id y email son obligatorios"}), 400

    oauth = OAuthAccount.query.filter_by(provider=provider, provider_user_id=provider_user_id).first()
    if oauth:
        user = oauth.user
    else:
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email)
            db.session.add(user)
            db.session.flush()
            ensure_player_stats(user.id)
        db.session.add(OAuthAccount(user_id=user.id, provider=provider, provider_user_id=provider_user_id))
        db.session.commit()

    login_user(user)
    return jsonify({"ok": True, "user_id": user.id, "requires_username": user.username is None})


@api_bp.get("/auth/<provider>/callback")
def auth_callback(provider: str):
    provider = provider.lower()
    if provider not in ALLOWED_PROVIDERS:
        return jsonify({"error": "Provider not supported"}), 400
    return jsonify({"message": f"OAuth callback listo para {provider}."})


@api_bp.post("/auth/logout")
def auth_logout():
    logout_user()
    return jsonify({"ok": True})


@api_bp.get("/user/me")
@auth_required
def user_me(user: User):
    stats = PlayerStatistics.query.filter_by(user_id=user.id).first()
    return jsonify(
        {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "created_at": user.created_at.isoformat(),
            "statistics": {
                "missions_completed": stats.completed_missions if stats else 0,
                "samples_collected": stats.samples_collected if stats else 0,
                "distance_traveled": stats.distance_traveled if stats else 0,
                "time_played": stats.time_played if stats else 0,
                "mission_stats": stats.mission_stats if stats else {},
            },
        }
    )


@api_bp.post("/user/username")
@auth_required
def set_username(user: User):
    username = str((request.get_json(silent=True) or {}).get("username", ""))
    error = validate_username(username)
    if error:
        return jsonify({"error": error}), 400

    existing = User.query.filter(User.username.ilike(username)).first()
    if existing and existing.id != user.id:
        return jsonify({"error": "Este nombre de usuario ya está ocupado."}), 409

    user.username = username
    db.session.commit()
    return jsonify({"ok": True, "username": user.username})


@api_bp.get("/missions")
@auth_required
def missions(user: User):
    mission_rows = Mission.query.order_by(Mission.order_index.asc()).all()
    completed = completed_mission_ids(user.id)
    return jsonify(
        [
            {
                "id": m.id,
                "code": m.code,
                "title": m.title,
                "description": m.description,
                "status": mission_status_for_user(user.id, m, completed),
            }
            for m in mission_rows
        ]
    )


@api_bp.get("/missions/<int:mission_id>")
@auth_required
def mission_detail(user: User, mission_id: int):
    mission = db.session.get(Mission, mission_id)
    if not mission:
        return jsonify({"error": "Mission not found"}), 404
    completed = completed_mission_ids(user.id)
    return jsonify(
        {
            "id": mission.id,
            "code": mission.code,
            "title": mission.title,
            "description": mission.description,
            "status": mission_status_for_user(user.id, mission, completed),
        }
    )


@api_bp.get("/progress")
@auth_required
def get_progress(user: User):
    rows = MissionProgress.query.filter_by(user_id=user.id).all()
    return jsonify(
        [
            {
                "mission_id": r.mission_id,
                "status": r.status,
                "resources": r.resources,
                "updated_at": r.updated_at.isoformat(),
            }
            for r in rows
        ]
    )


@api_bp.post("/progress")
@auth_required
def save_progress(user: User):
    body = request.get_json(silent=True) or {}
    mission_id = int(body.get("mission_id", 0))
    mission = db.session.get(Mission, mission_id)
    if not mission:
        return jsonify({"error": "Mission not found"}), 404

    completed = completed_mission_ids(user.id)
    if mission_status_for_user(user.id, mission, completed) == "LOCKED":
        return jsonify({"error": "MISSION LOCKED"}), 403

    progress = MissionProgress.query.filter_by(user_id=user.id, mission_id=mission_id).first()
    if not progress:
        progress = MissionProgress(user_id=user.id, mission_id=mission_id)
        db.session.add(progress)

    progress.status = str(body.get("status", progress.status))
    progress.resources = body.get("resources", progress.resources)
    progress.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"ok": True})


@api_bp.post("/decisions")
@auth_required
def save_decision(user: User):
    body = request.get_json(silent=True) or {}
    mission_id = int(body.get("mission_id", 0))
    mission = db.session.get(Mission, mission_id)
    if not mission:
        return jsonify({"error": "Mission not found"}), 404
    completed = completed_mission_ids(user.id)
    if mission_status_for_user(user.id, mission, completed) == "LOCKED":
        return jsonify({"error": "MISSION LOCKED"}), 403

    decision = Decision(
        user_id=user.id,
        mission_id=mission_id,
        key=str(body.get("key", "")),
        value=str(body.get("value", "")),
    )
    db.session.add(decision)
    db.session.commit()
    return jsonify({"ok": True, "decision_id": decision.id})


@api_bp.get("/samples")
@auth_required
def list_samples(user: User):
    rows = Sample.query.filter_by(user_id=user.id).all()
    return jsonify(
        [
            {
                "id": s.id,
                "sample_code": s.sample_code,
                "type": s.sample_type,
                "mass": s.mass,
                "coordinates": {"x": s.coord_x, "y": s.coord_y, "z": s.coord_z},
                "composition": s.composition,
                "status": s.status,
                "mission": s.mission_id,
                "created_at": s.created_at.isoformat(),
                "scientific_value": s.scientific_value,
            }
            for s in rows
        ]
    )


@api_bp.post("/samples")
@auth_required
def create_sample(user: User):
    body = request.get_json(silent=True) or {}
    mission_id = int(body.get("mission_id", 0))
    mission = db.session.get(Mission, mission_id)
    if not mission:
        return jsonify({"error": "Mission not found"}), 404
    completed = completed_mission_ids(user.id)
    if mission_status_for_user(user.id, mission, completed) == "LOCKED":
        return jsonify({"error": "MISSION LOCKED"}), 403

    sample = Sample(
        sample_code=str(body.get("sample_code", "")).strip(),
        user_id=user.id,
        mission_id=mission_id,
        sample_type=str(body.get("sample_type", "UNKNOWN_SAMPLE")),
        mass=float(body.get("mass", 0.0)),
        coord_x=float(body.get("coord_x", 0.0)),
        coord_y=float(body.get("coord_y", 0.0)),
        coord_z=float(body.get("coord_z", 0.0)),
        composition=body.get("composition", {}),
        scientific_value=int(body.get("scientific_value", 0)),
    )
    db.session.add(sample)

    stats = PlayerStatistics.query.filter_by(user_id=user.id).first()
    if stats:
        stats.samples_collected += 1

    db.session.commit()
    return jsonify({"ok": True, "id": sample.id})


@api_bp.post("/samples/<int:sample_id>/analyze")
@auth_required
def analyze_sample(user: User, sample_id: int):
    sample = Sample.query.filter_by(id=sample_id, user_id=user.id).first()
    if not sample:
        return jsonify({"error": "Sample not found"}), 404

    sample.status = "analyzed"
    payload = {
        "density": round(sample.mass / 100.0, 2),
        "temperature": -150 if sample.sample_type.upper().startswith("LUNAR") else -40,
        "elements": list(sample.composition.keys()),
    }
    db.session.add(ScientificData(user_id=user.id, mission_id=sample.mission_id, sample_id=sample.id, payload=payload))
    db.session.commit()
    return jsonify({"ok": True, "analysis": payload})


@api_bp.get("/inventory")
@auth_required
def inventory(user: User):
    items = InventoryItem.query.filter_by(user_id=user.id).all()
    return jsonify(
        [
            {"id": i.id, "mission_id": i.mission_id, "item_key": i.item_key, "quantity": i.quantity}
            for i in items
        ]
    )


@api_bp.post("/mission/<int:mission_id>/complete")
@auth_required
def complete_mission(user: User, mission_id: int):
    mission = db.session.get(Mission, mission_id)
    if not mission:
        return jsonify({"error": "Mission not found"}), 404
    completed = completed_mission_ids(user.id)
    if mission_status_for_user(user.id, mission, completed) == "LOCKED":
        return jsonify({"error": "MISSION LOCKED", "message": "Complete Mission 01 to unlock this mission."}), 403

    if not MissionResult.query.filter_by(user_id=user.id, mission_id=mission.id).first():
        db.session.add(MissionResult(user_id=user.id, mission_id=mission.id, score=100, summary="Mission completed"))
        try:
            db.session.flush()
        except IntegrityError:
            db.session.rollback()
            completed = completed_mission_ids(user.id)

    stats = PlayerStatistics.query.filter_by(user_id=user.id).first()
    if stats:
        stats.completed_missions = len(completed | {mission.id})

    db.session.commit()
    return jsonify({"ok": True})


@api_bp.get("/statistics")
@auth_required
def statistics(user: User):
    stats = PlayerStatistics.query.filter_by(user_id=user.id).first()
    return jsonify(
        {
            "completed_missions": stats.completed_missions if stats else 0,
            "samples_collected": stats.samples_collected if stats else 0,
            "distance_traveled": stats.distance_traveled if stats else 0,
            "time_played": stats.time_played if stats else 0,
            "mission_stats": stats.mission_stats if stats else {},
        }
    )
