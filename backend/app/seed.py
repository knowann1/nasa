from .extensions import db
from .models import Mission

DEFAULT_MISSIONS = [
    {
        "id": 1,
        "code": "MISSION_01",
        "title": "THE BEGINNING",
        "description": "FIRST ROCKET",
        "order_index": 1,
    },
    {
        "id": 2,
        "code": "MISSION_02",
        "title": "MOONSHOT",
        "description": "HUMANITY REACHES THE MOON",
        "order_index": 2,
    },
    {
        "id": 3,
        "code": "MISSION_03",
        "title": "RED PLANET",
        "description": "THE FIRST ROVER",
        "order_index": 3,
    },
]


def seed_missions() -> None:
    if Mission.query.count() > 0:
        return
    for mission in DEFAULT_MISSIONS:
        db.session.add(Mission(**mission))
    db.session.commit()
