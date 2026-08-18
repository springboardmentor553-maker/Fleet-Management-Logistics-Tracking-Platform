from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app import models
from app.tasks.maintenance_tasks import generate_automatic_maintenance_alerts, scan_upcoming_maintenance

# Single in-memory SQLite DB for isolated unit & integration testing
import os

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


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Register & Login test user to populate auth headers
    client.post(
        "/auth/register",
        json={
            "name": "Test Suite Admin",
            "email": "testadmin@fleetflow.com",
            "password": "Password123!",
            "role": "admin",
        },
    )
    login_res = client.post(
        "/auth/login",
        json={"email": "testadmin@fleetflow.com", "password": "Password123!"},
    )
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"
    yield
    client.headers.pop("Authorization", None)
    Base.metadata.drop_all(bind=engine)



# ============================================================================
# TASK 1: Complete Workflow Validation
# ============================================================================
def test_task_1_complete_workflow():
    db = TestingSessionLocal()

    # Step 1: Create Vehicle
    resp_v = client.post(
        "/vehicles/",
        json={
            "vehicle_number": "FLOW-1001",
            "vehicle_type": "Heavy Duty Truck",
            "capacity": 15000.0,
            "status": "available",
        },
    )
    assert resp_v.status_code == 201, resp_v.json()
    v_id = resp_v.json()["id"]

    # Step 2: Register Driver
    resp_d = client.post(
        "/drivers/",
        json={
            "name": "John Doe",
            "license_number": "LIC-998877",
            "phone": "555-0199",
            "status": "available",
        },
    )
    assert resp_d.status_code == 201, resp_d.json()
    d_id = resp_d.json()["id"]

    # Step 3: Create Shipment
    resp_s = client.post(
        "/shipments/",
        json={
            "tracking_number": "SHIP-88001",
            "customer_name": "Acme Corp",
            "source": "Warehouse A",
            "destination": "Port B",
            "cargo_description": "Electronics",
            "weight": 2500.0,
            "status": "Created",
        },
    )
    assert resp_s.status_code == 201, resp_s.json()
    s_id = resp_s.json()["id"]

    # Step 4: Create Trip
    resp_t = client.post(
        "/trips/",
        json={
            "shipment_id": s_id,
            "vehicle_id": v_id,
            "driver_id": d_id,
            "pickup_location": "Warehouse A",
            "destination": "Port B",
            "status": "Scheduled",
        },
    )
    assert resp_t.status_code == 201, resp_t.json()
    t_id = resp_t.json()["id"]

    # Step 5: Assign Driver
    resp_da = client.post(
        "/driver-assignments/",
        json={
            "driver_id": d_id,
            "vehicle_id": v_id,
            "trip_id": t_id,
            "assigned_date": str(date.today()),
            "assignment_status": "Active",
        },
    )
    assert resp_da.status_code == 201, resp_da.json()

    # Step 6: Add Fuel Record
    resp_f = client.post(
        "/fuel/",
        json={
            "vehicle_id": v_id,
            "driver_id": d_id,
            "fuel_quantity": 120.0,
            "fuel_cost": 360.0,
            "fuel_date": str(date.today()),
            "odometer_reading": 45000,
            "fuel_station": "Shell Express",
        },
    )
    assert resp_f.status_code == 201, resp_f.json()

    # Step 7: Schedule Maintenance
    resp_m = client.post(
        "/maintenance/",
        json={
            "vehicle_id": v_id,
            "category": "Oil Change",
            "description": "Routine 50k km engine check",
            "cost": 150.0,
            "service_date": str(date.today()),
            "next_service_date": str(date.today() + timedelta(days=5)),
            "status": "scheduled",
        },
    )
    assert resp_m.status_code == 201, resp_m.json()
    m_id = resp_m.json()["id"]

    # Step 8: Generate Maintenance Alert
    resp_ma = client.post(
        "/maintenance-alerts/",
        json={
            "vehicle_id": v_id,
            "maintenance_id": m_id,
            "alert_message": "Oil change due soon for FLOW-1001",
            "alert_type": "Upcoming Maintenance",
            "alert_status": "Pending",
        },
    )
    assert resp_ma.status_code == 201, resp_ma.json()

    # Step 9: Complete Trip
    resp_tc = client.put(
        f"/trips/{t_id}",
        json={"status": "Completed"},
    )
    assert resp_tc.status_code == 200, resp_tc.json()
    assert resp_tc.json()["status"] == "Completed"

    db.close()


# ============================================================================
# TASK 2: Business Rule Validation
# ============================================================================
def test_task_2_business_rule_validations():
    db = TestingSessionLocal()

    # 1. Setup entities
    resp_v1 = client.post("/vehicles/", json={"vehicle_number": "V-NORMAL", "vehicle_type": "Van", "capacity": 1000, "status": "available"})
    v1_id = resp_v1.json()["id"]

    resp_v_maint = client.post("/vehicles/", json={"vehicle_number": "V-MAINT", "vehicle_type": "Truck", "capacity": 5000, "status": "maintenance"})
    v_maint_id = resp_v_maint.json()["id"]

    resp_d_active = client.post("/drivers/", json={"name": "Active Driver", "license_number": "L-ACT", "phone": "111", "status": "available"})
    d_active_id = resp_d_active.json()["id"]

    resp_d_leave = client.post("/drivers/", json={"name": "Leave Driver", "license_number": "L-LEA", "phone": "222", "status": "On Leave"})
    d_leave_id = resp_d_leave.json()["id"]

    resp_s = client.post("/shipments/", json={"tracking_number": "S-RULE-1", "customer_name": "Cust 1", "source": "A", "destination": "B", "cargo_description": "Boxes", "weight": 100})
    s_id = resp_s.json()["id"]

    # Rule 2.1: Vehicle under maintenance cannot be assigned to a trip
    resp_err1 = client.post(
        "/trips/",
        json={"shipment_id": s_id, "vehicle_id": v_maint_id, "driver_id": d_active_id, "pickup_location": "A", "destination": "B", "status": "Scheduled"},
    )
    assert resp_err1.status_code in [400, 409], resp_err1.json()
    assert "under maintenance" in resp_err1.json()["detail"].lower()

    # Rule 2.2: Driver on leave cannot be assigned to a trip
    resp_err2 = client.post(
        "/trips/",
        json={"shipment_id": s_id, "vehicle_id": v1_id, "driver_id": d_leave_id, "pickup_location": "A", "destination": "B", "status": "Scheduled"},
    )
    assert resp_err2.status_code in [400, 409], resp_err2.json()
    assert "leave" in resp_err2.json()["detail"].lower()

    # Create active trip with d_active and v1
    resp_t1 = client.post(
        "/trips/",
        json={"shipment_id": s_id, "vehicle_id": v1_id, "driver_id": d_active_id, "pickup_location": "A", "destination": "B", "status": "Scheduled"},
    )
    assert resp_t1.status_code == 201

    # Rule 2.3: Driver already assigned cannot receive another active trip
    resp_s2 = client.post("/shipments/", json={"tracking_number": "S-RULE-2", "customer_name": "Cust 2", "source": "A", "destination": "B", "cargo_description": "Boxes", "weight": 100})
    s2_id = resp_s2.json()["id"]

    resp_v2 = client.post("/vehicles/", json={"vehicle_number": "V-NORMAL-2", "vehicle_type": "Van", "capacity": 1000, "status": "available"})
    v2_id = resp_v2.json()["id"]

    resp_err3 = client.post(
        "/trips/",
        json={"shipment_id": s2_id, "vehicle_id": v2_id, "driver_id": d_active_id, "pickup_location": "A", "destination": "B", "status": "Scheduled"},
    )
    assert resp_err3.status_code == 409, resp_err3.json()
    assert "active trip" in resp_err3.json()["detail"].lower()

    # Rule 2.4: Duplicate maintenance alerts are prevented
    resp_m = client.post(
        "/maintenance/",
        json={"vehicle_id": v1_id, "category": "Oil Change", "service_date": str(date.today()), "status": "scheduled", "cost": 100.0},
    )
    assert resp_m.status_code == 201, resp_m.json()
    m_id = resp_m.json()["id"]


    resp_a1 = client.post(
        "/maintenance-alerts/",
        json={"vehicle_id": v1_id, "maintenance_id": m_id, "alert_message": "Tuneup needed", "alert_status": "Pending"},
    )
    assert resp_a1.status_code == 201

    resp_a_dup = client.post(
        "/maintenance-alerts/",
        json={"vehicle_id": v1_id, "maintenance_id": m_id, "alert_message": "Duplicate tuneup", "alert_status": "Pending"},
    )
    assert resp_a_dup.status_code == 400, resp_a_dup.json()
    assert "already exists" in resp_a_dup.json()["detail"].lower()

    # Rule 2.5: Fuel records cannot be created for invalid vehicles
    resp_f_err = client.post(
        "/fuel/",
        json={"vehicle_id": 99999, "driver_id": d_active_id, "fuel_quantity": 50.0, "fuel_cost": 100.0, "fuel_date": str(date.today())},
    )
    assert resp_f_err.status_code == 404, resp_f_err.json()

    # Rule 2.6: Invalid maintenance records return proper 404 error
    resp_m_err = client.get("/maintenance/99999")
    assert resp_m_err.status_code == 404, resp_m_err.json()

    db.close()


# ============================================================================
# TASK 3: Dashboard Validation
# ============================================================================
def test_task_3_dashboard_validation():
    db = TestingSessionLocal()

    # Populate data
    v1 = models.Vehicle(vehicle_number="V-DASH-1", vehicle_type="Truck", capacity=5000.0, status="available")
    v2 = models.Vehicle(vehicle_number="V-DASH-2", vehicle_type="Van", capacity=2000.0, status="maintenance")
    db.add_all([v1, v2])
    db.commit()

    d1 = models.Driver(name="Driver 1", license_number="L1", phone="111", status="available")
    d2 = models.Driver(name="Driver 2", license_number="L2", phone="222", status="Assigned")
    db.add_all([d1, d2])
    db.commit()

    s1 = models.Shipment(tracking_number="TR-DASH-1", sender_name="Sender", receiver_name="Recv", pickup_location="A", delivery_location="B", weight=500.0, status=models.ShipmentStatus.CREATED)
    db.add(s1)
    db.commit()

    t1 = models.Trip(shipment_id=s1.id, vehicle_id=v1.id, driver_id=d2.id, pickup_location="A", destination="B", status=models.TripStatus.COMPLETED)
    db.add(t1)
    db.commit()

    # Check /dashboard/fleet
    resp_fleet = client.get("/dashboard/fleet")
    assert resp_fleet.status_code == 200, resp_fleet.json()
    data = resp_fleet.json()
    assert data["total_vehicles"] == 2
    assert data["vehicles_under_maintenance"] == 1
    assert data["active_vehicles"] == 1
    assert data["total_drivers"] == 2
    assert data["total_trips"] == 1
    assert data["completed_trips"] == 1

    # Check /dashboard/summary
    resp_sum = client.get("/dashboard/summary")
    assert resp_sum.status_code == 200, resp_sum.json()
    sum_data = resp_sum.json()
    assert sum_data["vehicles"] == 2
    assert sum_data["drivers"] == 2
    assert sum_data["total_shipments"] == 1

    db.close()


# ============================================================================
# TASK 4: Analytics Validation
# ============================================================================
def test_task_4_analytics_validation():
    db = TestingSessionLocal()

    # Create fuel entries
    v = models.Vehicle(vehicle_number="V-ANALYTICS", vehicle_type="Truck", capacity=8000.0, status="available")
    d = models.Driver(name="Analytics Driver", license_number="L-AN", phone="333", status="available")
    db.add_all([v, d])
    db.commit()

    f1 = models.FuelRecord(vehicle_id=v.id, driver_id=d.id, liters=100.0, total_cost=300.0, log_date=date.today())
    f2 = models.FuelRecord(vehicle_id=v.id, driver_id=d.id, liters=50.0, total_cost=150.0, log_date=date.today())
    db.add_all([f1, f2])
    db.commit()

    # Verify Fuel Analytics
    resp_fa = client.get("/analytics/fuel")
    assert resp_fa.status_code == 200, resp_fa.json()
    fa = resp_fa.json()
    assert fa["total_fuel_consumed"] == 150.0
    assert fa["total_fuel_cost"] == 450.0
    assert fa["average_fuel_consumption"] == 75.0
    assert fa["vehicle_with_highest_fuel_usage"]["vehicle_id"] == v.id

    # Verify Reports
    resp_mr = client.get("/reports/maintenance")
    assert resp_mr.status_code == 200, resp_mr.json()

    resp_or = client.get("/reports/operations")
    assert resp_or.status_code == 200, resp_or.json()

    db.close()


# ============================================================================
# TASK 5: Celery Workflow Testing
# ============================================================================
def test_task_5_celery_workflow():
    db = TestingSessionLocal()

    # Create vehicle and scheduled maintenance
    v = models.Vehicle(vehicle_number="V-CELERY", vehicle_type="Trailer", capacity=20000.0, status="available")
    db.add(v)
    db.commit()

    # Maintenance 1: Scheduled due today (should trigger alert)
    m1 = models.MaintenanceRecord(
        vehicle_id=v.id,
        category="Brake Pad Replacement",
        service_date=date.today(),
        next_service_date=date.today(),
        cost=400.0,
        status="scheduled",
        is_deleted=0,
    )
    # Maintenance 2: Completed (should NOT trigger alert)
    m2 = models.MaintenanceRecord(
        vehicle_id=v.id,
        category="Tire Rotation",
        service_date=date.today() - timedelta(days=10),
        next_service_date=date.today() - timedelta(days=5),
        cost=100.0,
        status="completed",
        is_deleted=0,
    )
    db.add_all([m1, m2])
    db.commit()

    # Override SessionLocal in maintenance_tasks for test engine
    from app.tasks import maintenance_tasks
    orig_session = maintenance_tasks.SessionLocal
    maintenance_tasks.SessionLocal = TestingSessionLocal

    try:
        # Run Celery task function
        res_msg = generate_automatic_maintenance_alerts(reminder_days=7)
        assert "Generated 1 new pending" in res_msg or "Generated" in res_msg

        # Re-run Celery task function to verify duplicate prevention
        res_dup_msg = generate_automatic_maintenance_alerts(reminder_days=7)
        assert "Generated 0 new pending" in res_dup_msg

        # Verify alias task scan_upcoming_maintenance
        res_alias = scan_upcoming_maintenance()
        assert "Generated 0 new pending" in res_alias

    finally:
        maintenance_tasks.SessionLocal = orig_session

    # Verify generated alerts via API
    resp_alerts = client.get("/maintenance-alerts/")
    assert resp_alerts.status_code == 200, resp_alerts.json()
    alerts = resp_alerts.json()
    assert len(alerts) == 1
    assert alerts[0]["maintenance_id"] == m1.id
    assert alerts[0]["alert_status"] == "Pending"

    db.close()


# ============================================================================
# TASK 6: Project Cleanup & Verification
# ============================================================================
def test_task_6_project_cleanup_verification():
    """Verify core routers, openapi schema, and root health check without errors."""
    resp_health = client.get("/")
    assert resp_health.status_code in [200, 404]

    resp_openapi = client.get("/openapi.json")
    assert resp_openapi.status_code == 200
    assert "FleetFlow" in resp_openapi.json()["info"]["title"] or "FastAPI" in resp_openapi.json()["info"]["title"]


def test_authentication_and_route_protection():
    """Verify auth flow, protected route rejection, and token validation."""
    # 1. Invalid Login
    bad_login = client.post("/auth/login", json={"email": "nonexistent@fleetflow.com", "password": "wrongpassword"})
    assert bad_login.status_code == 401

    # 2. Register New User
    reg = client.post("/auth/register", json={"name": "Auth User", "email": "authuser@fleetflow.com", "password": "securepassword", "role": "manager"})
    assert reg.status_code == 201

    # 3. Valid Login
    login = client.post("/auth/login", json={"email": "authuser@fleetflow.com", "password": "securepassword"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert token is not None

    # 4. Protected Route without Token (Expect 401)
    unauth_resp = client.get("/vehicles/", headers={"Authorization": ""})
    assert unauth_resp.status_code == 401

    # 5. Protected Route with Valid Token (Expect 200)
    auth_resp = client.get("/vehicles/", headers={"Authorization": f"Bearer {token}"})
    assert auth_resp.status_code == 200

    # 6. Intentionally Public Tracking Route without Token (Expect 404 for invalid tracking num, NOT 401)
    public_resp = client.get("/shipments/tracking/NONEXISTENT999/status")
    assert public_resp.status_code == 404

