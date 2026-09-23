def login(client):
    response = client.post(
        "/api/auth/google",
        json={"provider_user_id": "u1", "email": "player@example.com"},
    )
    assert response.status_code == 200


def test_username_validation_and_uniqueness(client):
    login(client)

    too_short = client.post("/api/user/username", json={"username": "ab"})
    assert too_short.status_code == 400

    reserved = client.post("/api/user/username", json={"username": "admin"})
    assert reserved.status_code == 400

    ok = client.post("/api/user/username", json={"username": "andres_01"})
    assert ok.status_code == 200

    second = client.post(
        "/api/auth/github",
        json={"provider_user_id": "u2", "email": "other@example.com"},
    )
    assert second.status_code == 200

    conflict = client.post("/api/user/username", json={"username": "andres_01"})
    assert conflict.status_code == 409


def test_mission_locking_and_unlock(client):
    login(client)
    client.post("/api/user/username", json={"username": "astro_1"})

    missions = client.get("/api/missions")
    payload = missions.get_json()
    assert payload[0]["status"] == "AVAILABLE"
    assert payload[1]["status"] == "LOCKED"

    blocked = client.post("/api/progress", json={"mission_id": 2, "status": "in_progress", "resources": {}})
    assert blocked.status_code == 403

    complete = client.post("/api/mission/1/complete")
    assert complete.status_code == 200

    missions_after = client.get("/api/missions").get_json()
    assert missions_after[1]["status"] == "AVAILABLE"
