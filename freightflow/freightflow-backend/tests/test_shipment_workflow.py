
from tests.conftest import login_as_admin


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _bootstrap_vehicle_and_driver(client, token):
    vehicle = client.post(
        "/api/v1/vehicles",
        json={"plate_number": "KA-03-EF-9012", "vehicle_type": "Box truck", "capacity_kg": 3000},
        headers=_auth_headers(token),
    ).json()

    driver_account = client.post(
        "/api/v1/accounts",
        json={"full_name": "Driver One", "email": "driver1@example.com", "password": "DriverPass123!", "role": "driver"},
        headers=_auth_headers(token),
    ).json()

    driver = client.post(
        "/api/v1/drivers",
        json={
            "account_id": driver_account["id"],
            "license_number": "DL-0001",
            "license_expiry": "2030-01-01",
        },
        headers=_auth_headers(token),
    ).json()

    return vehicle, driver


def test_full_shipment_lifecycle(client, db_session):
    token = login_as_admin(client, db_session)
    vehicle, driver = _bootstrap_vehicle_and_driver(client, token)

    shipment = client.post(
        "/api/v1/shipments",
        json={
            "reference_code": "SHP-0001",
            "origin": "Chennai DC",
            "destination": "Bengaluru Hub",
            "weight_kg": 500,
            "scheduled_at": "2026-08-01T09:00:00Z",
        },
        headers=_auth_headers(token),
    ).json()
    assert shipment["status"] == "pending"

    assign = client.post(
        f"/api/v1/shipments/{shipment['id']}/assign",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"]},
        headers=_auth_headers(token),
    )
    assert assign.status_code == 200
    assert assign.json()["status"] == "assigned"

    # Driver should now be on_trip
    driver_after_assign = client.get(f"/api/v1/drivers/{driver['id']}", headers=_auth_headers(token)).json()
    assert driver_after_assign["status"] == "on_trip"

    transit = client.post(f"/api/v1/shipments/{shipment['id']}/start-transit", headers=_auth_headers(token))
    assert transit.status_code == 200
    assert transit.json()["status"] == "in_transit"

    delivered = client.post(f"/api/v1/shipments/{shipment['id']}/deliver", headers=_auth_headers(token))
    assert delivered.status_code == 200
    assert delivered.json()["status"] == "delivered"
    assert delivered.json()["delivered_at"] is not None

    # Driver should be freed up again after delivery
    driver_after_delivery = client.get(f"/api/v1/drivers/{driver['id']}", headers=_auth_headers(token)).json()
    assert driver_after_delivery["status"] == "available"


def test_cannot_assign_already_assigned_shipment(client, db_session):
    token = login_as_admin(client, db_session)
    vehicle, driver = _bootstrap_vehicle_and_driver(client, token)

    shipment = client.post(
        "/api/v1/shipments",
        json={
            "reference_code": "SHP-0002",
            "origin": "Chennai DC",
            "destination": "Hyderabad Hub",
            "weight_kg": 300,
            "scheduled_at": "2026-08-02T09:00:00Z",
        },
        headers=_auth_headers(token),
    ).json()

    first_assign = client.post(
        f"/api/v1/shipments/{shipment['id']}/assign",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"]},
        headers=_auth_headers(token),
    )
    assert first_assign.status_code == 200

    second_assign = client.post(
        f"/api/v1/shipments/{shipment['id']}/assign",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"]},
        headers=_auth_headers(token),
    )
    assert second_assign.status_code == 409


def test_cancel_releases_driver(client, db_session):
    token = login_as_admin(client, db_session)
    vehicle, driver = _bootstrap_vehicle_and_driver(client, token)

    shipment = client.post(
        "/api/v1/shipments",
        json={
            "reference_code": "SHP-0003",
            "origin": "Chennai DC",
            "destination": "Coimbatore Hub",
            "weight_kg": 200,
            "scheduled_at": "2026-08-03T09:00:00Z",
        },
        headers=_auth_headers(token),
    ).json()

    client.post(
        f"/api/v1/shipments/{shipment['id']}/assign",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"]},
        headers=_auth_headers(token),
    )

    cancel = client.post(f"/api/v1/shipments/{shipment['id']}/cancel", headers=_auth_headers(token))
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"

    driver_after_cancel = client.get(f"/api/v1/drivers/{driver['id']}", headers=_auth_headers(token)).json()
    assert driver_after_cancel["status"] == "available"


def test_tracking_ping_and_latest_position(client, db_session):
    token = login_as_admin(client, db_session)
    vehicle, driver = _bootstrap_vehicle_and_driver(client, token)

    shipment = client.post(
        "/api/v1/shipments",
        json={
            "reference_code": "SHP-0004",
            "origin": "Chennai DC",
            "destination": "Madurai Hub",
            "weight_kg": 150,
            "scheduled_at": "2026-08-04T09:00:00Z",
        },
        headers=_auth_headers(token),
    ).json()

    ping = client.post(
        "/api/v1/tracking/ping",
        json={"shipment_id": shipment["id"], "vehicle_id": vehicle["id"], "latitude": 13.05, "longitude": 80.25, "speed_kmh": 42},
    )
    assert ping.status_code == 201

    latest = client.get(f"/api/v1/tracking/shipment/{shipment['id']}/latest")
    assert latest.status_code == 200
    assert latest.json()["latitude"] == 13.05
