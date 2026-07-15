from tests.conftest import login_as_admin


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _bootstrap_vehicle_and_driver(client, token, suffix="0001"):
    vehicle = client.post(
        "/api/v1/vehicles",
        json={"plate_number": f"KA-09-TR-{suffix}", "vehicle_type": "Box truck", "capacity_kg": 3000},
        headers=_auth_headers(token),
    ).json()

    driver_account = client.post(
        "/api/v1/accounts",
        json={
            "full_name": f"Trip Driver {suffix}",
            "email": f"trip.driver.{suffix}@example.com",
            "password": "DriverPass123!",
            "role": "driver",
        },
        headers=_auth_headers(token),
    ).json()

    driver = client.post(
        "/api/v1/drivers",
        json={
            "account_id": driver_account["id"],
            "license_number": f"DL-TRIP-{suffix}",
            "license_expiry": "2030-01-01",
        },
        headers=_auth_headers(token),
    ).json()

    return vehicle, driver


def _create_shipment(client, token, ref="SHP-TRIP-0001"):
    return client.post(
        "/api/v1/shipments",
        json={
            "reference_code": ref,
            "origin": "Chennai DC",
            "destination": "Bengaluru Hub",
            "weight_kg": 500,
            "scheduled_at": "2026-08-01T09:00:00Z",
        },
        headers=_auth_headers(token),
    ).json()


def test_create_and_get_trip(client, db_session):
    token = login_as_admin(client, db_session)
    vehicle, driver = _bootstrap_vehicle_and_driver(client, token, "0001")
    shipment = _create_shipment(client, token, "SHP-TRIP-0001")

    create = client.post(
        "/api/v1/trips",
        json={
            "shipment_id": shipment["id"],
            "driver_id": driver["id"],
            "vehicle_id": vehicle["id"],
            "pickup_location": "Chennai DC",
            "destination": "Bengaluru Hub",
            "scheduled_start_time": "2026-08-01T09:00:00Z",
            "scheduled_end_time": "2026-08-01T18:00:00Z",
        },
        headers=_auth_headers(token),
    )
    assert create.status_code == 201
    body = create.json()
    assert body["status"] == "scheduled"

    fetched = client.get(f"/api/v1/trips/{body['id']}", headers=_auth_headers(token))
    assert fetched.status_code == 200
    assert fetched.json()["shipment_id"] == shipment["id"]

    listing = client.get("/api/v1/trips", headers=_auth_headers(token))
    assert listing.status_code == 200
    assert listing.json()["total"] == 1


def test_create_trip_rejects_missing_references(client, db_session):
    token = login_as_admin(client, db_session)
    vehicle, driver = _bootstrap_vehicle_and_driver(client, token, "0002")
    shipment = _create_shipment(client, token, "SHP-TRIP-0002")

    missing_driver = client.post(
        "/api/v1/trips",
        json={
            "shipment_id": shipment["id"],
            "driver_id": 99999,
            "vehicle_id": vehicle["id"],
            "pickup_location": "Chennai DC",
            "destination": "Bengaluru Hub",
            "scheduled_start_time": "2026-08-01T09:00:00Z",
            "scheduled_end_time": "2026-08-01T18:00:00Z",
        },
        headers=_auth_headers(token),
    )
    assert missing_driver.status_code == 404


def test_prevents_double_assignment_of_driver_and_vehicle(client, db_session):
    token = login_as_admin(client, db_session)
    vehicle, driver = _bootstrap_vehicle_and_driver(client, token, "0003")
    shipment_a = _create_shipment(client, token, "SHP-TRIP-0003A")
    shipment_b = _create_shipment(client, token, "SHP-TRIP-0003B")

    first_trip = client.post(
        "/api/v1/trips",
        json={
            "shipment_id": shipment_a["id"],
            "driver_id": driver["id"],
            "vehicle_id": vehicle["id"],
            "pickup_location": "Chennai DC",
            "destination": "Bengaluru Hub",
            "scheduled_start_time": "2026-08-01T09:00:00Z",
            "scheduled_end_time": "2026-08-01T18:00:00Z",
        },
        headers=_auth_headers(token),
    )
    assert first_trip.status_code == 201

    # Same driver & vehicle, different shipment -> should be rejected (already active).
    second_trip = client.post(
        "/api/v1/trips",
        json={
            "shipment_id": shipment_b["id"],
            "driver_id": driver["id"],
            "vehicle_id": vehicle["id"],
            "pickup_location": "Bengaluru Hub",
            "destination": "Hyderabad Hub",
            "scheduled_start_time": "2026-08-02T09:00:00Z",
            "scheduled_end_time": "2026-08-02T18:00:00Z",
        },
        headers=_auth_headers(token),
    )
    assert second_trip.status_code == 409


def test_prevents_double_assignment_of_shipment(client, db_session):
    token = login_as_admin(client, db_session)
    vehicle_1, driver_1 = _bootstrap_vehicle_and_driver(client, token, "0004")
    vehicle_2, driver_2 = _bootstrap_vehicle_and_driver(client, token, "0005")
    shipment = _create_shipment(client, token, "SHP-TRIP-0004")

    first_trip = client.post(
        "/api/v1/trips",
        json={
            "shipment_id": shipment["id"],
            "driver_id": driver_1["id"],
            "vehicle_id": vehicle_1["id"],
            "pickup_location": "Chennai DC",
            "destination": "Bengaluru Hub",
            "scheduled_start_time": "2026-08-01T09:00:00Z",
            "scheduled_end_time": "2026-08-01T18:00:00Z",
        },
        headers=_auth_headers(token),
    )
    assert first_trip.status_code == 201

    duplicate_shipment_trip = client.post(
        "/api/v1/trips",
        json={
            "shipment_id": shipment["id"],
            "driver_id": driver_2["id"],
            "vehicle_id": vehicle_2["id"],
            "pickup_location": "Chennai DC",
            "destination": "Bengaluru Hub",
            "scheduled_start_time": "2026-08-03T09:00:00Z",
            "scheduled_end_time": "2026-08-03T18:00:00Z",
        },
        headers=_auth_headers(token),
    )
    assert duplicate_shipment_trip.status_code == 409


def test_update_and_delete_trip(client, db_session):
    token = login_as_admin(client, db_session)
    vehicle, driver = _bootstrap_vehicle_and_driver(client, token, "0006")
    shipment = _create_shipment(client, token, "SHP-TRIP-0005")

    created = client.post(
        "/api/v1/trips",
        json={
            "shipment_id": shipment["id"],
            "driver_id": driver["id"],
            "vehicle_id": vehicle["id"],
            "pickup_location": "Chennai DC",
            "destination": "Bengaluru Hub",
            "scheduled_start_time": "2026-08-01T09:00:00Z",
            "scheduled_end_time": "2026-08-01T18:00:00Z",
        },
        headers=_auth_headers(token),
    ).json()

    updated = client.patch(
        f"/api/v1/trips/{created['id']}",
        json={"status": "in_progress"},
        headers=_auth_headers(token),
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "in_progress"

    deleted = client.delete(f"/api/v1/trips/{created['id']}", headers=_auth_headers(token))
    assert deleted.status_code == 204

    missing = client.get(f"/api/v1/trips/{created['id']}", headers=_auth_headers(token))
    assert missing.status_code == 404
