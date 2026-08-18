from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app import models
from app.tasks.maintenance_tasks import generate_automatic_maintenance_alerts

# Use file-based SQLite database for test isolated runs
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_fleet.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_maintenance_alerts_full_workflow():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Register/Login user for test client authentication
    client.post(
        "/auth/register",
        json={
            "name": "Maint Admin",
            "email": "maintadmin@fleetflow.com",
            "password": "Password123!",
            "role": "admin",
        },
    )
    login_res = client.post(
        "/auth/login",
        json={"email": "maintadmin@fleetflow.com", "password": "Password123!"},
    )
    if login_res.status_code == 200:
        client.headers["Authorization"] = f"Bearer {login_res.json()['access_token']}"

    # 1. Create a dummy vehicle

    vehicle = models.Vehicle(
        vehicle_number="TRUCK-9999",
        vehicle_type="Heavy Truck",
        capacity=10000.0,
        status="available",
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    # 2. Create dummy maintenance records
    record1 = models.MaintenanceRecord(
        vehicle_id=vehicle.id,
        category="Oil Change",
        service_date=date.today() - timedelta(days=5),
        next_service_date=date.today() - timedelta(days=2),
        cost=250.0,
        status="scheduled",
    )
    record2 = models.MaintenanceRecord(
        vehicle_id=vehicle.id,
        category="Brake Service",
        service_date=date.today() + timedelta(days=2),
        next_service_date=date.today() + timedelta(days=2),
        cost=500.0,
        status="completed",
    )
    db.add_all([record1, record2])
    db.commit()
    db.refresh(record1)
    db.refresh(record2)

    # ----------------------------------------------------
    # Task 2 Testing: Create Alert API Validation
    # ----------------------------------------------------

    # Invalid vehicle_id -> 404
    resp = client.post(
        "/maintenance-alerts/",
        json={
            "vehicle_id": 99999,
            "maintenance_id": record1.id,
            "alert_message": "Test Alert",
            "alert_status": "Pending",
        },
    )
    assert resp.status_code == 404, resp.json()

    # Invalid maintenance_id -> 404
    resp = client.post(
        "/maintenance-alerts/",
        json={
            "vehicle_id": vehicle.id,
            "maintenance_id": 99999,
            "alert_message": "Test Alert",
            "alert_status": "Pending",
        },
    )
    assert resp.status_code == 404, resp.json()

    # Successful creation
    resp = client.post(
        "/maintenance-alerts/",
        json={
            "vehicle_id": vehicle.id,
            "maintenance_id": record1.id,
            "alert_message": "Oil change overdue for vehicle TRUCK-9999",
            "alert_type": "Overdue Maintenance",
            "alert_status": "Pending",
        },
    )
    assert resp.status_code == 201, resp.json()
    alert_data = resp.json()
    alert_id = alert_data["id"]
    assert alert_data["alert_status"] == "Pending"

    # Duplicate pending alert prevention -> 400
    resp_dup = client.post(
        "/maintenance-alerts/",
        json={
            "vehicle_id": vehicle.id,
            "maintenance_id": record1.id,
            "alert_message": "Duplicate test",
            "alert_status": "Pending",
        },
    )
    assert resp_dup.status_code == 400, resp_dup.json()
    assert "already exists" in resp_dup.json()["detail"]

    # Get All Alerts
    resp_all = client.get("/maintenance-alerts/")
    assert resp_all.status_code == 200, resp_all.json()
    assert len(resp_all.json()) == 1

    # Get Alert by ID
    resp_get = client.get(f"/maintenance-alerts/{alert_id}")
    assert resp_get.status_code == 200, resp_get.json()
    assert resp_get.json()["id"] == alert_id

    # Update Alert Status
    resp_status = client.put(
        f"/maintenance-alerts/{alert_id}/status",
        json={"alert_status": "Completed"},
    )
    assert resp_status.status_code == 200, resp_status.json()
    assert resp_status.json()["alert_status"] == "Completed"

    # ----------------------------------------------------
    # Task 3 Testing: Maintenance Reports API
    # ----------------------------------------------------
    resp_report = client.get("/reports/maintenance")
    assert resp_report.status_code == 200, resp_report.json()
    rep = resp_report.json()

    assert rep["total_maintenance_records"] == 2
    assert rep["vehicles_under_maintenance"] == 1
    assert rep["completed_services"] == 1
    assert rep["overdue_services"] == 1
    assert rep["total_maintenance_cost"] == 750.0
    assert rep["most_frequent_maintenance_category"] in ["Oil Change", "Brake Service"]

    # ----------------------------------------------------
    # Task 5 Testing: Automatic Alert Generation Celery Task
    # ----------------------------------------------------
    # Add third record due tomorrow
    record3 = models.MaintenanceRecord(
        vehicle_id=vehicle.id,
        category="Tyre Replacement",
        service_date=date.today() + timedelta(days=1),
        next_service_date=date.today() + timedelta(days=1),
        cost=300.0,
        status="scheduled",
    )
    db.add(record3)
    db.commit()
    db.close()

    # Override SessionLocal in maintenance_tasks for test engine
    from app.tasks import maintenance_tasks
    orig_session_local = maintenance_tasks.SessionLocal
    maintenance_tasks.SessionLocal = TestingSessionLocal

    try:
        res_msg = generate_automatic_maintenance_alerts(reminder_days=7)
        assert "Generated" in res_msg
    finally:
        maintenance_tasks.SessionLocal = orig_session_local

    # Check newly generated alert via API
    resp_alerts = client.get("/maintenance-alerts/?alert_status=Pending")
    assert resp_alerts.status_code == 200, resp_alerts.json()
    pending_alerts = resp_alerts.json()
    assert len(pending_alerts) >= 1

    # Test Delete Alert
    resp_del = client.delete(f"/maintenance-alerts/{alert_id}")
    assert resp_del.status_code == 200, resp_del.json()

    Base.metadata.drop_all(bind=engine)
    print("ALL TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_maintenance_alerts_full_workflow()
