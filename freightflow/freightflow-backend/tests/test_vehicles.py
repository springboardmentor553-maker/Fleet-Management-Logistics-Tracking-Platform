from tests.conftest import login_as_admin


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_vehicle(client, db_session):
    token = login_as_admin(client, db_session)

    create = client.post(
        "/api/v1/vehicles",
        json={"plate_number": "KA-01-AB-1234", "vehicle_type": "Box truck", "capacity_kg": 2000},
        headers=_auth_headers(token),
    )
    assert create.status_code == 201
    assert create.json()["status"] == "active"

    listing = client.get("/api/v1/vehicles", headers=_auth_headers(token))
    assert listing.status_code == 200
    assert listing.json()["total"] == 1


def test_duplicate_plate_number_is_rejected(client, db_session):
    token = login_as_admin(client, db_session)
    payload = {"plate_number": "KA-01-AB-1234", "vehicle_type": "Box truck", "capacity_kg": 2000}

    first = client.post("/api/v1/vehicles", json=payload, headers=_auth_headers(token))
    assert first.status_code == 201

    second = client.post("/api/v1/vehicles", json=payload, headers=_auth_headers(token))
    assert second.status_code == 409


def test_vehicle_status_update(client, db_session):
    token = login_as_admin(client, db_session)
    created = client.post(
        "/api/v1/vehicles",
        json={"plate_number": "KA-02-CD-5678", "vehicle_type": "Van", "capacity_kg": 900},
        headers=_auth_headers(token),
    ).json()

    updated = client.patch(
        f"/api/v1/vehicles/{created['id']}",
        json={"status": "in_shop"},
        headers=_auth_headers(token),
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "in_shop"
