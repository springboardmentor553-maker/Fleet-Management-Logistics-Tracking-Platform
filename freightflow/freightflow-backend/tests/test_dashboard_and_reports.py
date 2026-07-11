from tests.conftest import login_as_admin


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_dashboard_summary_reflects_created_vehicle(client, db_session):
    token = login_as_admin(client, db_session)

    client.post(
        "/api/v1/vehicles",
        json={"plate_number": "KA-04-GH-3456", "vehicle_type": "Trailer", "capacity_kg": 5000},
        headers=_auth_headers(token),
    )

    summary = client.get("/api/v1/dashboard/summary", headers=_auth_headers(token))
    assert summary.status_code == 200
    body = summary.json()
    assert body["fleet"]["total_vehicles"] == 1
    assert body["fleet"]["active_vehicles"] == 1


def test_delivery_performance_report_runs_with_no_data(client, db_session):
    token = login_as_admin(client, db_session)
    response = client.get("/api/v1/reports/delivery-performance", headers=_auth_headers(token))
    assert response.status_code == 200
    assert response.json()["total_shipments"] == 0
