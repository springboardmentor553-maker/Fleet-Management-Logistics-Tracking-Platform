"""
test_maintenance_alerts.py
───────────────────────────
Tests for Tasks 1 - 6:
- MaintenanceAlert Model & DB creation
- MaintenanceAlert CRUD APIs
- Validations (Vehicle exists, Maintenance exists, Prevent duplicate Pending alerts)
- Maintenance Reports API (GET /reports/maintenance)
- Celery Task execution & Automatic Alert Generation logic
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.tasks.maintenance_tasks import check_maintenance_schedules

# ── Setup single shared in-memory SQLite database for testing ────────────────
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_get_current_user():
    return User(id=1, name="Admin Verifier", email="admin_test@fleetflow.com", role="admin")


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Create admin user
    admin_user = User(
        name="Admin Verifier",
        email="admin_test@fleetflow.com",
        hashed_password="hashed_pass_test",
        role="admin"
    )
    db.add(admin_user)

    # Create test vehicles
    v1 = Vehicle(
        plate_number="KA-01-AL-1111",
        vehicle_type="Truck",
        model="Volvo FH16",
        fuel_type="Diesel",
        capacity_kg=20000.0,
        current_status="available"
    )
    v2 = Vehicle(
        plate_number="KA-02-AL-2222",
        vehicle_type="Truck",
        model="Tata Prima",
        fuel_type="Diesel",
        capacity_kg=15000.0,
        current_status="maintenance"
    )
    db.add_all([v1, v2])
    db.commit()
    db.refresh(v1)
    db.refresh(v2)

    # Create test maintenance records
    now = datetime.utcnow()
    m1 = MaintenanceRecord(
        vehicle_id=v1.id,
        category="Oil Change",
        description="Routine oil change",
        cost=250.0,
        status="scheduled",
        scheduled_date=now - timedelta(days=2),  # OVERDUE
        next_service_date=now + timedelta(days=3), # DUE SOON
    )
    m2 = MaintenanceRecord(
        vehicle_id=v2.id,
        category="Oil Change",
        description="Engine check",
        cost=500.0,
        status="completed",
        scheduled_date=now - timedelta(days=10),
        completed_date=now - timedelta(days=8),
        next_service_date=now + timedelta(days=30),
    )
    db.add_all([m1, m2])
    db.commit()
    db.refresh(m1)
    db.refresh(m2)

    setup_db.v1_id = v1.id
    setup_db.m1_id = m1.id

    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer mock_token"}


@pytest.fixture
def client():
    return TestClient(app)


# ── TEST SUITE ────────────────────────────────────────────────────────────────

def test_create_alert_validations(client, auth_headers):
    v1_id = setup_db.v1_id
    m1_id = setup_db.m1_id

    # 1. Invalid Vehicle ID
    res = client.post("/maintenance-alerts/", json={
        "vehicle_id": 99999,
        "maintenance_id": m1_id,
        "alert_message": "Test alert",
        "alert_type": "service_due",
        "alert_status": "Pending"
    }, headers=auth_headers)
    assert res.status_code == 404
    assert "Vehicle not found" in res.json()["detail"]

    # 2. Invalid Maintenance ID
    res = client.post("/maintenance-alerts/", json={
        "vehicle_id": v1_id,
        "maintenance_id": 99999,
        "alert_message": "Test alert",
        "alert_type": "service_due",
        "alert_status": "Pending"
    }, headers=auth_headers)
    assert res.status_code == 404
    assert "Maintenance record not found" in res.json()["detail"]

    # 3. Successful Alert Creation
    res = client.post("/maintenance-alerts/", json={
        "vehicle_id": v1_id,
        "maintenance_id": m1_id,
        "alert_message": "Oil change due soon for vehicle KA-01-AL-1111",
        "alert_type": "service_due",
        "alert_status": "Pending"
    }, headers=auth_headers)
    if res.status_code != 201:
        print(f"\n--- DEBUG_ERROR: status={res.status_code}, json={res.json()} ---\n")
    assert res.status_code == 201
    data = res.json()
    assert data["vehicle_id"] == v1_id
    assert data["maintenance_id"] == m1_id
    assert data["alert_status"] == "Pending"

    # 4. Duplicate Pending Alert Prevention
    res_dup = client.post("/maintenance-alerts/", json={
        "vehicle_id": v1_id,
        "maintenance_id": m1_id,
        "alert_message": "Duplicate attempt",
        "alert_type": "service_due",
        "alert_status": "Pending"
    }, headers=auth_headers)
    assert res_dup.status_code == 400
    assert "pending alert already exists" in res_dup.json()["detail"].lower()


def test_get_and_update_alerts(client, auth_headers):
    # Get all alerts created by previous test
    res = client.get("/maintenance-alerts/", headers=auth_headers)
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) >= 1
    target_id = alerts[0]["id"]

    # Get single alert by ID
    res_single = client.get(f"/maintenance-alerts/{target_id}", headers=auth_headers)
    assert res_single.status_code == 200
    assert res_single.json()["id"] == target_id

    # Update Alert Status to "Completed"
    res_update = client.patch(f"/maintenance-alerts/{target_id}", json={
        "alert_status": "Completed"
    }, headers=auth_headers)
    assert res_update.status_code == 200
    assert res_update.json()["alert_status"] == "Completed"


def test_maintenance_report_api(client, auth_headers):
    res = client.get("/reports/maintenance", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_records" in data
    assert "vehicles_under_maintenance" in data
    assert "completed_services" in data
    assert "overdue_services" in data
    assert "total_maintenance_cost" in data
    assert "most_frequent_category" in data
    assert data["total_records"] >= 2
    assert data["total_maintenance_cost"] >= 750.0
    assert data["most_frequent_category"] == "Oil Change"


def test_automatic_alert_generation(client, auth_headers):
    import app.tasks.maintenance_tasks as mt
    orig_sl = mt.SessionLocal
    mt.SessionLocal = TestingSessionLocal
    try:
        result = check_maintenance_schedules()
        assert result["status"] == "success"
        assert "checked_records" in result
    finally:
        mt.SessionLocal = orig_sl
