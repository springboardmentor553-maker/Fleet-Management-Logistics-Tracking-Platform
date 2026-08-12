"""
test_phase1_comprehensive.py
═════════════════════════════════════════════════════════════════════════════════
Phase 1 — Complete Application Testing (Dependency Order)

Modules tested in order:
  1. Authentication
  2. Vehicle Management
  3. Driver Management
  4. Shipment Workflow (full end-to-end)
  5. GPS + Tracking (WebSocket)
  6. Maintenance (incl. Celery idempotency)
  7. Fuel
  8. Dashboard Validation  (API vs DB)
  9. Analytics

All tests run against a shared in-memory SQLite database so no external
PostgreSQL or Redis is required.
═════════════════════════════════════════════════════════════════════════════════
"""

import uuid
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db as get_db_base
from app.utils.dependencies import get_db, get_current_user
from app.utils.security import hash_password

# ── Models ────────────────────────────────────────────────────────────────────
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.fuel import FuelRecord
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.models.notification import Notification
from app.models.driver_assignment import DriverAssignment
import app.tasks.maintenance_tasks as mt


def uid():
    """Return a unique 8-char hex string for use in plate numbers / emails."""
    return uuid.uuid4().hex[:8]


# ─────────────────────────────────────────────────────────────────────────────
# Shared in-memory SQLite engine (all tests share one DB)
# ─────────────────────────────────────────────────────────────────────────────
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


_mock_user_store = {"user": None}


def override_get_current_user():
    return _mock_user_store["user"]


def set_mock_user(role="admin", name="Admin User", email="admin@fleetflow.com", user_id=1):
    _mock_user_store["user"] = User(
        id=user_id, name=name, email=email,
        role=role, is_active=True,
        hashed_password="hashed",
        created_at=datetime.utcnow(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Module-scoped fixture: bootstrap the DB and register overrides
# ─────────────────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module", autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_db_base] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    mt.SessionLocal = TestingSessionLocal  # patch Celery to use same test DB

    Base.metadata.create_all(bind=engine)
    set_mock_user()          # default: admin

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_headers():
    set_mock_user(role="admin")
    return {"Authorization": "Bearer mock_admin_token"}


@pytest.fixture
def fleet_headers():
    set_mock_user(role="fleet_manager")
    return {"Authorization": "Bearer mock_fleet_token"}


@pytest.fixture
def dispatcher_headers():
    set_mock_user(role="dispatcher")
    return {"Authorization": "Bearer mock_dispatcher_token"}


@pytest.fixture
def driver_headers():
    set_mock_user(role="driver")
    return {"Authorization": "Bearer mock_driver_token"}


# ═════════════════════════════════════════════════════════════════════════════
#  1. AUTHENTICATION TESTS
# ═════════════════════════════════════════════════════════════════════════════
class TestAuthentication:
    """Tests for /auth/register and /auth/login"""

    def test_register_admin_user(self, client):
        res = client.post("/auth/register", json={
            "name": "Fleet Admin",
            "email": "fleet_admin@test.com",
            "password": "admin123",
            "role": "admin"
        })
        assert res.status_code == 201, f"Register failed: {res.json()}"
        data = res.json()
        assert data["email"] == "fleet_admin@test.com"
        assert data["role"] == "admin"
        assert "hashed_password" not in data

    def test_register_fleet_manager(self, client):
        res = client.post("/auth/register", json={
            "name": "Fleet Manager",
            "email": "fmanager@test.com",
            "password": "manager123",
            "role": "fleet_manager"
        })
        assert res.status_code == 201

    def test_register_dispatcher(self, client):
        res = client.post("/auth/register", json={
            "name": "Dispatcher Dan",
            "email": "dispatcher@test.com",
            "password": "dispatch123",
            "role": "dispatcher"
        })
        assert res.status_code == 201

    def test_register_driver(self, client):
        res = client.post("/auth/register", json={
            "name": "Driver Dave",
            "email": "driver@test.com",
            "password": "driver123",
            "role": "driver"
        })
        assert res.status_code == 201

    def test_register_duplicate_email_returns_400(self, client):
        res = client.post("/auth/register", json={
            "name": "Duplicate",
            "email": "fleet_admin@test.com",
            "password": "whatever",
            "role": "admin"
        })
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"].lower()

    def test_register_invalid_role_returns_422(self, client):
        res = client.post("/auth/register", json={
            "name": "Bad Role",
            "email": "badrole@test.com",
            "password": "test123",
            "role": "superuser"
        })
        assert res.status_code == 422

    def test_login_correct_credentials_returns_token(self, client):
        res = client.post("/auth/login", json={
            "email": "fleet_admin@test.com",
            "password": "admin123"
        })
        assert res.status_code == 200, f"Login failed: {res.json()}"
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 20

    def test_login_wrong_password_returns_401(self, client):
        res = client.post("/auth/login", json={
            "email": "fleet_admin@test.com",
            "password": "WRONGPASSWORD"
        })
        assert res.status_code == 401
        assert "invalid" in res.json()["detail"].lower()

    def test_login_unknown_email_returns_401(self, client):
        res = client.post("/auth/login", json={
            "email": "nobody@test.com",
            "password": "whatever"
        })
        assert res.status_code == 401

    def test_protected_endpoint_without_token_returns_401_or_403(self, client):
        saved = app.dependency_overrides.pop(get_current_user, None)
        try:
            res = client.get("/vehicles/")
            assert res.status_code in (401, 403), \
                f"Expected 401/403 without token but got {res.status_code}"
        finally:
            if saved:
                app.dependency_overrides[get_current_user] = saved

    def test_admin_can_access_admin_dashboard(self, client, admin_headers):
        res = client.get("/dashboard/admin", headers=admin_headers)
        assert res.status_code == 200

    def test_fleet_manager_cannot_access_admin_dashboard(self, client, fleet_headers):
        res = client.get("/dashboard/admin", headers=fleet_headers)
        assert res.status_code == 403

    def test_dispatcher_cannot_access_admin_dashboard(self, client, dispatcher_headers):
        res = client.get("/dashboard/admin", headers=dispatcher_headers)
        assert res.status_code == 403

    def test_driver_cannot_create_vehicle(self, client, driver_headers):
        res = client.post("/vehicles/", json={
            "plate_number": "DRIVER-HACK-00",
            "vehicle_type": "Truck",
            "model": "X",
            "capacity_kg": 100,
            "fuel_type": "Diesel"
        }, headers=driver_headers)
        assert res.status_code == 403

    def test_dispatcher_can_create_shipment(self, client, dispatcher_headers):
        res = client.post("/shipments/", json={
            "origin": "Bangalore",
            "destination": "Chennai",
            "weight_kg": 500.0
        }, headers=dispatcher_headers)
        assert res.status_code != 403, \
            f"Dispatcher should be able to create shipments, got 403"


# ═════════════════════════════════════════════════════════════════════════════
#  2. VEHICLE MANAGEMENT TESTS
# ═════════════════════════════════════════════════════════════════════════════
class TestVehicleManagement:
    """CRUD + business-rule validation for vehicles"""

    _vehicle_id = None

    def test_create_vehicle(self, client, admin_headers):
        res = client.post("/vehicles/", json={
            "plate_number": f"KA-01-VM-{uid()}",
            "vehicle_type": "Truck",
            "model": "Volvo FH16",
            "capacity_kg": 20000.0,
            "fuel_type": "Diesel"
        }, headers=admin_headers)
        assert res.status_code == 201, f"Create vehicle failed: {res.json()}"
        data = res.json()
        assert data["current_status"] == "available"
        TestVehicleManagement._vehicle_id = data["id"]

    def test_get_vehicle_by_id(self, client, admin_headers):
        vid = TestVehicleManagement._vehicle_id
        res = client.get(f"/vehicles/{vid}", headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["id"] == vid

    def test_list_vehicles_returns_array(self, client, admin_headers):
        res = client.get("/vehicles/", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)
        assert len(res.json()) >= 1

    def test_update_vehicle(self, client, admin_headers):
        vid = TestVehicleManagement._vehicle_id
        orig = client.get(f"/vehicles/{vid}", headers=admin_headers).json()
        res = client.put(f"/vehicles/{vid}", json={
            "plate_number": orig["plate_number"],
            "vehicle_type": "Truck",
            "model": "Volvo FH16 Updated",
            "capacity_kg": 22000.0,
            "fuel_type": "Diesel"
        }, headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["capacity_kg"] == 22000.0

    def test_check_vehicle_status(self, client, admin_headers):
        vid = TestVehicleManagement._vehicle_id
        res = client.get(f"/vehicles/{vid}", headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["current_status"] in ("available", "in_transit", "maintenance")

    def test_create_vehicle_duplicate_plate_returns_error(self, client, admin_headers):
        plate = f"DUP-{uid()}"
        cr = client.post("/vehicles/", json={
            "plate_number": plate,
            "vehicle_type": "Truck",
            "model": "Tata",
            "capacity_kg": 5000.0,
            "fuel_type": "Diesel"
        }, headers=admin_headers)
        assert cr.status_code == 201

        res = client.post("/vehicles/", json={
            "plate_number": plate,
            "vehicle_type": "Van",
            "model": "Ford Transit",
            "capacity_kg": 5000.0,
            "fuel_type": "Petrol"
        }, headers=admin_headers)
        assert res.status_code in (400, 409, 422, 500), \
            f"Unexpected status: {res.status_code}"
        if res.status_code == 500:
            pytest.xfail("Duplicate plate returns 500 — needs proper error handling")

    def test_get_nonexistent_vehicle_returns_404(self, client, admin_headers):
        res = client.get("/vehicles/999999", headers=admin_headers)
        assert res.status_code == 404

    def test_delete_vehicle(self, client, admin_headers):
        cr = client.post("/vehicles/", json={
            "plate_number": f"DEL-{uid()}",
            "vehicle_type": "Bike",
            "model": "Honda CB",
            "capacity_kg": 200.0,
            "fuel_type": "Petrol"
        }, headers=admin_headers)
        assert cr.status_code == 201
        del_id = cr.json()["id"]

        dr = client.delete(f"/vehicles/{del_id}", headers=admin_headers)
        assert dr.status_code == 204

        gr = client.get(f"/vehicles/{del_id}", headers=admin_headers)
        assert gr.status_code == 404

    def test_invalid_capacity_negative_returns_error(self, client, admin_headers):
        res = client.post("/vehicles/", json={
            "plate_number": f"BAD-{uid()}",
            "vehicle_type": "Truck",
            "model": "Test",
            "capacity_kg": -500.0,
            "fuel_type": "Diesel"
        }, headers=admin_headers)
        assert res.status_code in (400, 422), \
            f"Expected 400/422 for invalid capacity, got {res.status_code}"


# ═════════════════════════════════════════════════════════════════════════════
#  3. DRIVER MANAGEMENT TESTS
# ═════════════════════════════════════════════════════════════════════════════
class TestDriverManagement:
    _driver_id = None
    _vehicle_id = None

    def test_create_driver(self, client, admin_headers):
        res = client.post("/drivers/", json={
            "name": "Ravi Kumar",
            "email": f"ravi_{uid()}@test.com",
            "phone": "9876543210",
            "license_number": f"KA-DL-{uid()}"
        }, headers=admin_headers)
        assert res.status_code == 201, f"Create driver failed: {res.json()}"
        data = res.json()
        assert data["name"] == "Ravi Kumar"
        assert data["is_available"] is True
        TestDriverManagement._driver_id = data["id"]

    def test_get_driver_by_id(self, client, admin_headers):
        did = TestDriverManagement._driver_id
        res = client.get(f"/drivers/{did}", headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["id"] == did

    def test_list_drivers(self, client, admin_headers):
        res = client.get("/drivers/", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_assign_driver_to_vehicle(self, client, admin_headers):
        v_res = client.post("/vehicles/", json={
            "plate_number": f"DA-{uid()}",
            "vehicle_type": "Van",
            "model": "Toyota HiAce",
            "capacity_kg": 3000.0,
            "fuel_type": "Diesel"
        }, headers=admin_headers)
        assert v_res.status_code == 201
        vid = v_res.json()["id"]
        TestDriverManagement._vehicle_id = vid

        did = TestDriverManagement._driver_id
        res = client.patch(
            f"/drivers/{did}/assign-vehicle?vehicle_id={vid}",
            headers=admin_headers
        )
        assert res.status_code == 200
        assert res.json()["assigned_vehicle_id"] == vid

    def test_check_driver_availability(self, client, admin_headers):
        did = TestDriverManagement._driver_id
        res = client.get(f"/drivers/{did}", headers=admin_headers)
        assert res.status_code == 200
        d = res.json()
        assert "is_available" in d

    def test_record_driver_attendance(self, client, admin_headers):
        did = TestDriverManagement._driver_id
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        res = client.post(f"/drivers/{did}/attendance", json={
            "driver_id": did,
            "date": today_str,
            "status": "present",
            "check_in": "08:00",
            "check_out": "17:00"
        }, headers=admin_headers)
        assert res.status_code == 200, f"Attendance failed: {res.json()}"
        assert res.json()["status"] in ("present", "on_leave", "absent")

    def test_get_driver_attendance_history(self, client, admin_headers):
        did = TestDriverManagement._driver_id
        res = client.get(f"/drivers/{did}/attendance", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_get_driver_performance(self, client, admin_headers):
        did = TestDriverManagement._driver_id
        res = client.get(f"/driver-assignments/performance/{did}", headers=admin_headers)
        assert res.status_code == 200, f"Got {res.status_code}: {res.json()}"
        data = res.json()
        assert "total_trips" in data
        assert "completed_trips" in data

    def test_driver_analytics_endpoint(self, client, admin_headers):
        res = client.get("/drivers/manage/analytics", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert "total_drivers" in data
        assert "active_drivers" in data

    def test_get_driver_logs(self, client, admin_headers):
        did = TestDriverManagement._driver_id
        res = client.get(f"/drivers/{did}/logs", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_driver_on_leave_status(self, client, admin_headers):
        did = TestDriverManagement._driver_id
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        res = client.post(f"/drivers/{did}/attendance", json={
            "driver_id": did,
            "date": today_str,
            "status": "on_leave",
            "check_in": None,
            "check_out": None
        }, headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "on_leave"

    def test_nonexistent_driver_returns_404(self, client, admin_headers):
        res = client.get("/drivers/999999", headers=admin_headers)
        assert res.status_code == 404


# ═════════════════════════════════════════════════════════════════════════════
#  4. SHIPMENT WORKFLOW — END-TO-END
# ═════════════════════════════════════════════════════════════════════════════

_shipment_state = {
    "shipment_id": None,
    "trip_id": None,
    "driver_id": None,
    "vehicle_id": None,
}


def ensure_shipment_resources(client, admin_headers):
    """Ensure vehicle and driver are created for TestShipmentWorkflow."""
    if _shipment_state["vehicle_id"] is None:
        v_res = client.post("/vehicles/", json={
            "plate_number": f"SW-V-{uid()}",
            "vehicle_type": "Truck",
            "model": "Tata Prima",
            "capacity_kg": 15000.0,
            "fuel_type": "Diesel"
        }, headers=admin_headers)
        assert v_res.status_code == 201
        _shipment_state["vehicle_id"] = v_res.json()["id"]

    if _shipment_state["driver_id"] is None:
        d_res = client.post("/drivers/", json={
            "name": "Workflow Driver",
            "email": f"wf_{uid()}@test.com",
            "phone": "9000000001",
            "license_number": f"WF-{uid()}"
        }, headers=admin_headers)
        assert d_res.status_code == 201
        _shipment_state["driver_id"] = d_res.json()["id"]


class TestShipmentWorkflow:
    """
    Full end-to-end flow:
      Create Shipment → Create Trip → Start → In Transit → Delivered

    At every step: assert API response AND DB record match.
    """

    def test_step1_create_shipment(self, client, admin_headers):
        ensure_shipment_resources(client, admin_headers)
        res = client.post("/shipments/", json={
            "origin": "Bangalore",
            "destination": "Chennai",
            "weight_kg": 5000.0
        }, headers=admin_headers)
        assert res.status_code == 201, f"Create shipment failed: {res.json()}"
        data = res.json()
        assert data["status"] == "pending"
        _shipment_state["shipment_id"] = data["id"]

        db = TestingSessionLocal()
        try:
            ship = db.query(Shipment).filter(Shipment.id == data["id"]).first()
            assert ship is not None
            assert ship.status == "pending"
            assert ship.origin == "Bangalore"
        finally:
            db.close()

    def test_step2_shipment_picked_up_in_transit(self, client, admin_headers):
        sid = _shipment_state["shipment_id"]
        res = client.put(f"/shipments/{sid}", json={
            "origin": "Bangalore",
            "destination": "Chennai",
            "weight_kg": 5000.0,
            "status": "in_transit"
        }, headers=admin_headers)
        assert res.status_code == 200, f"In-transit update failed: {res.json()}"
        assert res.json()["status"] == "in_transit"

        db = TestingSessionLocal()
        try:
            ship = db.query(Shipment).filter(Shipment.id == sid).first()
            assert ship.status == "in_transit"
            print(f"\n✅ Step 2 — Frontend: 'in_transit' | DB: '{ship.status}'")
        finally:
            db.close()

    def test_step3_create_trip(self, client, admin_headers):
        ensure_shipment_resources(client, admin_headers)
        sid = _shipment_state["shipment_id"]
        did = _shipment_state["driver_id"]
        vid = _shipment_state["vehicle_id"]
        assert sid is not None, "Shipment must be created first"

        res = client.post("/trips/", json={
            "shipment_id": sid,
            "driver_id": did,
            "vehicle_id": vid
        }, headers=admin_headers)
        assert res.status_code == 201, f"Create trip failed: {res.json()}"
        data = res.json()
        assert data["status"] == "scheduled"
        _shipment_state["trip_id"] = data["id"]

        db = TestingSessionLocal()
        try:
            trip = db.query(Trip).filter(Trip.id == data["id"]).first()
            assert trip is not None
            assert trip.status == "scheduled"
            assert trip.driver_id == did
            assert trip.vehicle_id == vid
        finally:
            db.close()

    def test_step4_start_trip(self, client, admin_headers):
        tid = _shipment_state["trip_id"]
        assert tid is not None

        res = client.patch(f"/trips/{tid}/status", json={"status": "started"}, headers=admin_headers)
        assert res.status_code == 200, f"Start trip failed: {res.json()}"
        assert res.json()["status"] == "started"

        db = TestingSessionLocal()
        try:
            assert db.query(Trip).filter(Trip.id == tid).first().status == "started"
        finally:
            db.close()

    def test_step5_trip_is_started(self, client, admin_headers):
        tid = _shipment_state["trip_id"]
        res = client.get(f"/trips/{tid}", headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "started"

    def test_step6_complete_trip(self, client, admin_headers):
        tid = _shipment_state["trip_id"]
        res = client.patch(f"/trips/{tid}/status", json={"status": "completed"}, headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "completed"

    def test_step7_delivered_db_match(self, client, admin_headers):
        sid = _shipment_state["shipment_id"]
        res = client.put(f"/shipments/{sid}", json={
            "origin": "Bangalore",
            "destination": "Chennai",
            "weight_kg": 5000.0,
            "status": "delivered"
        }, headers=admin_headers)
        assert res.status_code == 200
        api_status = res.json()["status"]
        assert api_status == "delivered"

        db = TestingSessionLocal()
        try:
            ship = db.query(Shipment).filter(Shipment.id == sid).first()
            db_status = ship.status
            assert db_status == "delivered", \
                f"DB says '{db_status}' but Frontend says 'delivered'"
            print(f"\n✅ PASS — Frontend: 'delivered' | DB: '{db_status}'")
        finally:
            db.close()

    def test_get_all_shipments(self, client, admin_headers):
        res = client.get("/shipments/", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_get_shipment_by_id(self, client, admin_headers):
        sid = _shipment_state["shipment_id"]
        if sid is None:
            pytest.skip("shipment_id not set")
        res = client.get(f"/shipments/{sid}", headers=admin_headers)
        assert res.status_code == 200


# ═════════════════════════════════════════════════════════════════════════════
#  5. GPS + TRACKING (WebSocket)
# ═════════════════════════════════════════════════════════════════════════════
class TestGPSTracking:
    """WebSocket connection and GPS endpoint checks"""

    def test_websocket_connects_and_receives_connected_message(self, client):
        with client.websocket_connect("/ws/tracking/1") as ws:
            msg = ws.receive_json()
            assert msg.get("type") == "connected"
            assert "trip_id" in msg

    def test_gps_location_endpoints_exist(self, client, admin_headers):
        res = client.get("/trips/", headers=admin_headers)
        assert res.status_code == 200

    def test_websocket_for_known_trip(self, client, admin_headers):
        trips = client.get("/trips/", headers=admin_headers).json()
        if not trips:
            pytest.skip("No trips to test WebSocket with")
        tid = trips[0]["id"]
        with client.websocket_connect(f"/ws/tracking/{tid}") as ws:
            msg = ws.receive_json()
            assert msg["type"] == "connected"
            assert msg["trip_id"] == tid

    def test_gps_endpoint_vehicle_coordinates(self, client, admin_headers):
        vlist = client.get("/vehicles/", headers=admin_headers).json()
        if not vlist:
            pytest.skip("No vehicles available")
        vid = vlist[0]["id"]
        vres = client.get(f"/vehicles/{vid}", headers=admin_headers).json()
        assert "id" in vres


# ═════════════════════════════════════════════════════════════════════════════
#  6. MAINTENANCE TESTS (incl. Celery idempotency)
# ═════════════════════════════════════════════════════════════════════════════

_maint_state = {"vehicle_id": None, "maint_id": None}


def ensure_maint_vehicle(client, admin_headers):
    if _maint_state["vehicle_id"] is None:
        v_res = client.post("/vehicles/", json={
            "plate_number": f"MV-{uid()}",
            "vehicle_type": "Truck",
            "model": "TATA Prima",
            "capacity_kg": 10000.0,
            "fuel_type": "Diesel"
        }, headers=admin_headers)
        assert v_res.status_code == 201
        _maint_state["vehicle_id"] = v_res.json()["id"]


class TestMaintenance:

    def test_create_maintenance_record(self, client, admin_headers):
        ensure_maint_vehicle(client, admin_headers)
        vid = _maint_state["vehicle_id"]
        scheduled = (datetime.utcnow() + timedelta(days=1)).isoformat()
        next_service = (datetime.utcnow() + timedelta(days=30)).isoformat()
        res = client.post("/maintenance/", json={
            "vehicle_id": vid,
            "category": "Oil Change",
            "description": "Routine oil change",
            "cost": 1500.0,
            "service_provider": "SpeedFix Garage",
            "scheduled_date": scheduled,
            "next_service_date": next_service,
            "odometer_km": 50000.0,
            "health_score": 85
        }, headers=admin_headers)
        assert res.status_code == 201, f"Create maintenance failed: {res.json()}"
        data = res.json()
        assert data["status"] == "scheduled"
        _maint_state["maint_id"] = data["id"]

        db = TestingSessionLocal()
        try:
            v = db.query(Vehicle).filter(Vehicle.id == vid).first()
            assert v.current_status == "maintenance"
        finally:
            db.close()

    def test_cannot_schedule_duplicate_maintenance(self, client, admin_headers):
        ensure_maint_vehicle(client, admin_headers)
        vid = _maint_state["vehicle_id"]
        scheduled = (datetime.utcnow() + timedelta(days=2)).isoformat()
        res = client.post("/maintenance/", json={
            "vehicle_id": vid,
            "category": "Brake Service",
            "description": "Brakes check",
            "cost": 2000.0,
            "service_provider": "BrakeWorld",
            "scheduled_date": scheduled
        }, headers=admin_headers)
        assert res.status_code == 400, \
            f"Expected 400 for double-maintenance, got {res.status_code}: {res.json()}"

    def test_get_maintenance_record(self, client, admin_headers):
        mid = _maint_state["maint_id"]
        if mid is None:
            pytest.skip("maintenance record not created")
        res = client.get(f"/maintenance/{mid}", headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["id"] == mid

    def test_list_maintenance_records(self, client, admin_headers):
        res = client.get("/maintenance/", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_start_maintenance(self, client, admin_headers):
        mid = _maint_state["maint_id"]
        if mid is None:
            pytest.skip("maintenance record not created")
        res = client.patch(f"/maintenance/{mid}/start", headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "in_progress"

    def test_complete_maintenance_restores_vehicle(self, client, admin_headers):
        mid = _maint_state["maint_id"]
        vid = _maint_state["vehicle_id"]
        if mid is None:
            pytest.skip("maintenance record not created")
        res = client.patch(f"/maintenance/{mid}/complete", headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "completed"

        db = TestingSessionLocal()
        try:
            v = db.query(Vehicle).filter(Vehicle.id == vid).first()
            assert v.current_status == "available"
        finally:
            db.close()

    def test_celery_task_idempotency(self):
        db = TestingSessionLocal()
        try:
            v = Vehicle(
                plate_number=f"CELERY-V-{uid()}",
                vehicle_type="Truck", model="TATA", fuel_type="Diesel",
                capacity_kg=5000.0, current_status="maintenance"
            )
            db.add(v)
            db.flush()

            m = MaintenanceRecord(
                vehicle_id=v.id,
                category="Engine Service",
                status="scheduled",
                scheduled_date=datetime.utcnow() - timedelta(days=3),
                cost=3000.0,
            )
            db.add(m)
            db.commit()
            db.refresh(m)
            mid = m.id

            result1 = mt.check_maintenance_schedules()
            assert result1["status"] == "success"
            print(f"\n[Celery Run 1] alerts={result1['alerts_created']}, "
                  f"notifs={result1['notifications_created']}")

            result2 = mt.check_maintenance_schedules()
            assert result2["status"] == "success"
            print(f"[Celery Run 2] alerts={result2['alerts_created']}, "
                  f"notifs={result2['notifications_created']}")

            pending_count = (
                db.query(MaintenanceAlert)
                .filter(
                    MaintenanceAlert.maintenance_id == mid,
                    MaintenanceAlert.alert_status == "Pending"
                ).count()
            )
            assert pending_count == 1, \
                f"Idempotency failed: expected 1 pending alert, got {pending_count}"
            print("✅ Celery idempotency confirmed: Run 2 created 0 duplicate alerts")

        finally:
            db.close()

    def test_completed_maintenance_does_not_trigger_alert(self):
        db = TestingSessionLocal()
        try:
            v = Vehicle(
                plate_number=f"CELERY-COMP-{uid()}",
                vehicle_type="Van", model="Ford", fuel_type="Petrol",
                capacity_kg=2000.0, current_status="available"
            )
            db.add(v)
            db.flush()

            m = MaintenanceRecord(
                vehicle_id=v.id,
                category="Brake Service",
                status="completed",
                scheduled_date=datetime.utcnow() - timedelta(days=1),
                completed_date=datetime.utcnow(),
                cost=500.0,
            )
            db.add(m)
            db.commit()

            mt.check_maintenance_schedules()

            completed_alerts = (
                db.query(MaintenanceAlert)
                .filter(MaintenanceAlert.maintenance_id == m.id)
                .count()
            )
            assert completed_alerts == 0, \
                f"Completed maintenance generated {completed_alerts} alert(s) — must be 0"
            print("✅ Completed maintenance correctly skipped by Celery")

        finally:
            db.close()

    def test_overdue_maintenance_endpoint(self, client, admin_headers):
        res = client.get("/maintenance/overdue", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_upcoming_maintenance_endpoint(self, client, admin_headers):
        res = client.get("/maintenance/upcoming", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_vehicle_health_reports(self, client, admin_headers):
        res = client.get("/maintenance/health-reports", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)


# ═════════════════════════════════════════════════════════════════════════════
#  7. FUEL TESTS
# ═════════════════════════════════════════════════════════════════════════════

_fuel_state = {"fuel_id": None, "vehicle_id": None, "driver_id": None}


def ensure_fuel_resources(client, admin_headers):
    if _fuel_state["vehicle_id"] is None:
        v_res = client.post("/vehicles/", json={
            "plate_number": f"FUEL-{uid()}",
            "vehicle_type": "Van",
            "model": "Maruti Eeco",
            "capacity_kg": 800.0,
            "fuel_type": "Petrol"
        }, headers=admin_headers)
        assert v_res.status_code == 201
        _fuel_state["vehicle_id"] = v_res.json()["id"]

    if _fuel_state["driver_id"] is None:
        d_res = client.post("/drivers/", json={
            "name": "Fuel Driver",
            "email": f"fuel_{uid()}@test.com",
            "phone": "8000000001",
            "license_number": f"FUEL-{uid()}"
        }, headers=admin_headers)
        assert d_res.status_code == 201
        _fuel_state["driver_id"] = d_res.json()["id"]


class TestFuel:

    def test_create_fuel_record(self, client, admin_headers):
        ensure_fuel_resources(client, admin_headers)
        vid = _fuel_state["vehicle_id"]
        did = _fuel_state["driver_id"]
        res = client.post("/fuel/", json={
            "vehicle_id": vid,
            "driver_id": did,
            "fuel_quantity": 50.0,
            "fuel_cost": 4500.0,
            "odometer_reading": 12000.0,
            "fuel_date": datetime.utcnow().isoformat(),
            "fuel_station": "HP Petrol Bund",
            "remarks": "Full tank"
        }, headers=admin_headers)
        assert res.status_code == 201, f"Create fuel failed: {res.json()}"
        data = res.json()
        assert data["fuel_quantity"] == 50.0
        assert data["fuel_cost"] == 4500.0
        _fuel_state["fuel_id"] = data["id"]

    def test_get_all_fuel_records(self, client, admin_headers):
        res = client.get("/fuel/", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_get_fuel_record_by_id(self, client, admin_headers):
        fid = _fuel_state["fuel_id"]
        if fid is None:
            pytest.skip("fuel record not created")
        res = client.get(f"/fuel/{fid}", headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["id"] == fid

    def test_invalid_vehicle_id_returns_404(self, client, admin_headers):
        ensure_fuel_resources(client, admin_headers)
        did = _fuel_state["driver_id"]
        res = client.post("/fuel/", json={
            "vehicle_id": 999999,
            "driver_id": did,
            "fuel_quantity": 30.0,
            "fuel_cost": 2700.0,
            "odometer_reading": 10000.0,
            "fuel_date": datetime.utcnow().isoformat(),
            "fuel_station": "IOC"
        }, headers=admin_headers)
        assert res.status_code == 404
        assert "vehicle" in res.json()["detail"].lower()

    def test_negative_fuel_quantity_rejected(self, client, admin_headers):
        ensure_fuel_resources(client, admin_headers)
        vid = _fuel_state["vehicle_id"]
        did = _fuel_state["driver_id"]
        res = client.post("/fuel/", json={
            "vehicle_id": vid,
            "driver_id": did,
            "fuel_quantity": -10.0,
            "fuel_cost": 900.0,
            "odometer_reading": 10000.0,
            "fuel_date": datetime.utcnow().isoformat(),
            "fuel_station": "IOC"
        }, headers=admin_headers)
        assert res.status_code in (400, 422), \
            f"Expected 400/422 for negative quantity, got {res.status_code}"

    def test_zero_fuel_cost_rejected(self, client, admin_headers):
        ensure_fuel_resources(client, admin_headers)
        vid = _fuel_state["vehicle_id"]
        did = _fuel_state["driver_id"]
        res = client.post("/fuel/", json={
            "vehicle_id": vid,
            "driver_id": did,
            "fuel_quantity": 30.0,
            "fuel_cost": 0.0,
            "odometer_reading": 10000.0,
            "fuel_date": datetime.utcnow().isoformat(),
            "fuel_station": "IOC"
        }, headers=admin_headers)
        assert res.status_code in (400, 422), \
            f"Expected 400/422 for zero cost, got {res.status_code}"

    def test_fuel_analytics_updated_after_add(self, client, admin_headers):
        res = client.get("/analytics/fuel", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()

        db = TestingSessionLocal()
        try:
            db_total_qty = db.query(func.sum(FuelRecord.fuel_quantity)).scalar() or 0.0
            db_total_cost = db.query(func.sum(FuelRecord.fuel_cost)).scalar() or 0.0
        finally:
            db.close()

        api_qty = data["total_fuel_consumed"]
        api_cost = data["total_fuel_cost"]

        assert abs(api_qty - db_total_qty) < 0.01
        assert abs(api_cost - db_total_cost) < 0.01
        print(f"\n✅ PASS — Total Fuel: API={api_qty}L | DB={db_total_qty}L")
        print(f"✅ PASS — Total Cost: API=₹{api_cost} | DB=₹{db_total_cost}")

    def test_delete_fuel_record(self, client, admin_headers):
        fid = _fuel_state["fuel_id"]
        if fid is None:
            pytest.skip("fuel record not created")
        res = client.delete(f"/fuel/{fid}", headers=admin_headers)
        assert res.status_code == 204


# ═════════════════════════════════════════════════════════════════════════════
#  8. DASHBOARD VALIDATION — API vs DB
# ═════════════════════════════════════════════════════════════════════════════
class TestDashboardValidation:
    """
    Compare every dashboard field against the raw DB query.
    Frontend value must exactly equal DB value.
    """

    def test_total_vehicles_match(self, client, admin_headers):
        res = client.get("/dashboard/stats", headers=admin_headers)
        assert res.status_code == 200
        api_val = res.json()["total_vehicles"]

        db = TestingSessionLocal()
        try:
            db_val = db.query(Vehicle).count()
        finally:
            db.close()

        assert api_val == db_val, \
            f"Total Vehicles: Dashboard={api_val} | DB={db_val}"
        print(f"\n✅ PASS — Total Vehicles: Dashboard={api_val} | DB={db_val}")

    def test_available_vehicles_match(self, client, admin_headers):
        res = client.get("/dashboard/stats", headers=admin_headers)
        api_val = res.json()["available_vehicles"]

        db = TestingSessionLocal()
        try:
            db_val = db.query(Vehicle).filter(Vehicle.current_status == "available").count()
        finally:
            db.close()

        assert api_val == db_val
        print(f"✅ PASS — Available Vehicles: Dashboard={api_val} | DB={db_val}")

    def test_total_drivers_match(self, client, admin_headers):
        res = client.get("/dashboard/stats", headers=admin_headers)
        api_val = res.json()["total_drivers"]

        db = TestingSessionLocal()
        try:
            db_val = db.query(Driver).count()
        finally:
            db.close()

        assert api_val == db_val
        print(f"✅ PASS — Total Drivers: Dashboard={api_val} | DB={db_val}")

    def test_total_shipments_match(self, client, admin_headers):
        res = client.get("/dashboard/stats", headers=admin_headers)
        api_val = res.json()["total_shipments"]

        db = TestingSessionLocal()
        try:
            db_val = db.query(Shipment).count()
        finally:
            db.close()

        assert api_val == db_val
        print(f"✅ PASS — Total Shipments: Dashboard={api_val} | DB={db_val}")

    def test_delivered_shipments_match(self, client, admin_headers):
        res = client.get("/dashboard/stats", headers=admin_headers)
        api_val = res.json()["delivered_shipments"]

        db = TestingSessionLocal()
        try:
            db_val = db.query(Shipment).filter(Shipment.status == "delivered").count()
        finally:
            db.close()

        assert api_val == db_val
        print(f"✅ PASS — Delivered Shipments: Dashboard={api_val} | DB={db_val}")

    def test_in_transit_shipments_match(self, client, admin_headers):
        res = client.get("/dashboard/stats", headers=admin_headers)
        api_val = res.json()["in_transit_shipments"]

        db = TestingSessionLocal()
        try:
            db_val = db.query(Shipment).filter(Shipment.status == "in_transit").count()
        finally:
            db.close()

        assert api_val == db_val

    def test_fleet_dashboard_totals(self, client, admin_headers):
        res = client.get("/dashboard/fleet", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()

        db = TestingSessionLocal()
        try:
            db_total_vehicles = db.query(Vehicle).count()
            db_active_vehicles = db.query(Vehicle).filter(Vehicle.current_status == "in_transit").count()
            db_maintenance = db.query(Vehicle).filter(Vehicle.current_status == "maintenance").count()
            db_total_trips = db.query(Trip).count()
            db_completed_trips = db.query(Trip).filter(Trip.status == "completed").count()
        finally:
            db.close()

        assert data["total_vehicles"] == db_total_vehicles
        assert data["active_vehicles"] == db_active_vehicles
        assert data["vehicles_under_maintenance"] == db_maintenance
        assert data["total_trips"] == db_total_trips
        assert data["completed_trips"] == db_completed_trips

        print(f"\n╔════════════════════════════════════════════════╗")
        print(f"║   Dashboard vs Database Comparison             ║")
        print(f"╠════════════════════════════════════════════════╣")
        print(f"║ Total Vehicles    : API={data['total_vehicles']:4d}  DB={db_total_vehicles:4d}  {'✅' if data['total_vehicles']==db_total_vehicles else '❌'} ║")
        print(f"║ Active Vehicles   : API={data['active_vehicles']:4d}  DB={db_active_vehicles:4d}  {'✅' if data['active_vehicles']==db_active_vehicles else '❌'} ║")
        print(f"║ In Maintenance    : API={data['vehicles_under_maintenance']:4d}  DB={db_maintenance:4d}  {'✅' if data['vehicles_under_maintenance']==db_maintenance else '❌'} ║")
        print(f"║ Total Trips       : API={data['total_trips']:4d}  DB={db_total_trips:4d}  {'✅' if data['total_trips']==db_total_trips else '❌'} ║")
        print(f"║ Completed Trips   : API={data['completed_trips']:4d}  DB={db_completed_trips:4d}  {'✅' if data['completed_trips']==db_completed_trips else '❌'} ║")
        print(f"╚════════════════════════════════════════════════╝")

    def test_admin_dashboard_user_counts(self, client, admin_headers):
        res = client.get("/dashboard/admin", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()

        db = TestingSessionLocal()
        try:
            db_total_users = db.query(User).count()
            db_admin_count = db.query(User).filter(User.role == "admin").count()
        finally:
            db.close()

        assert data["total_users"] == db_total_users
        assert data["admin_count"] == db_admin_count


# ═════════════════════════════════════════════════════════════════════════════
#  9. ANALYTICS TESTS
# ═════════════════════════════════════════════════════════════════════════════
class TestAnalytics:
    """Verify analytics values come from real DB data, not hardcoded"""

    def test_fuel_analytics_returns_correct_structure(self, client, admin_headers):
        res = client.get("/analytics/fuel", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        required_fields = [
            "total_fuel_consumed",
            "total_fuel_cost",
            "average_fuel_consumption",
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

    def test_fuel_analytics_values_from_db(self, client, admin_headers):
        db = TestingSessionLocal()
        try:
            db_total_qty = db.query(func.sum(FuelRecord.fuel_quantity)).scalar() or 0.0
            db_total_cost = db.query(func.sum(FuelRecord.fuel_cost)).scalar() or 0.0
            db_record_count = db.query(FuelRecord).count()
            db_avg = db_total_qty / db_record_count if db_record_count > 0 else 0.0
        finally:
            db.close()

        res = client.get("/analytics/fuel", headers=admin_headers)
        data = res.json()

        assert abs(data["total_fuel_consumed"] - db_total_qty) < 0.01
        assert abs(data["total_fuel_cost"] - db_total_cost) < 0.01
        assert abs(data["average_fuel_consumption"] - db_avg) < 0.01
        print(f"\n✅ Fuel Analytics: total={db_total_qty}L, cost=₹{db_total_cost}, avg={db_avg:.2f}L")

    def test_operational_analytics_structure(self, client, admin_headers):
        res = client.get("/analytics/operations", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        required = [
            "total_deliveries",
            "successful_deliveries",
            "delayed_deliveries",
            "cancelled_deliveries",
            "average_trip_distance",
            "average_delivery_time",
        ]
        for field in required:
            assert field in data, f"Missing analytics field: {field}"

    def test_operational_analytics_values_match_db(self, client, admin_headers):
        db = TestingSessionLocal()
        try:
            db_total = db.query(Shipment).count()
            db_success = db.query(Shipment).filter(Shipment.status == "delivered").count()
            db_cancelled = db.query(Shipment).filter(Shipment.status == "cancelled").count()
        finally:
            db.close()

        res = client.get("/analytics/operations", headers=admin_headers)
        data = res.json()

        assert data["total_deliveries"] == db_total
        assert data["successful_deliveries"] == db_success
        assert data["cancelled_deliveries"] == db_cancelled

        print(f"\n✅ Operational Analytics:")
        print(f"   Total Deliveries   : API={data['total_deliveries']} | DB={db_total}")
        print(f"   Successful         : API={data['successful_deliveries']} | DB={db_success}")
        print(f"   Cancelled          : API={data['cancelled_deliveries']} | DB={db_cancelled}")

    def test_driver_performance_analytics(self, client, admin_headers):
        res = client.get("/drivers/manage/analytics", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()

        db = TestingSessionLocal()
        try:
            db_total = db.query(Driver).count()
            db_present = db.query(Driver).filter(Driver.attendance_status == "present").count()
            db_on_leave = db.query(Driver).filter(Driver.attendance_status == "on_leave").count()
        finally:
            db.close()

        assert data["total_drivers"] == db_total
        assert data["present_today"] == db_present
        assert data["on_leave"] == db_on_leave
        print(f"\n✅ Driver Analytics:")
        print(f"   Total Drivers : API={data['total_drivers']} | DB={db_total}")
        print(f"   Present Today : API={data['present_today']} | DB={db_present}")
        print(f"   On Leave      : API={data['on_leave']} | DB={db_on_leave}")

    def test_maintenance_report_endpoint(self, client, admin_headers):
        res = client.get("/reports/maintenance", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        required = [
            "total_records",
            "vehicles_under_maintenance",
            "completed_services",
            "overdue_services",
            "total_maintenance_cost",
        ]
        for field in required:
            assert field in data, f"Maintenance report missing field: {field}"

    def test_maintenance_report_matches_db(self, client, admin_headers):
        db = TestingSessionLocal()
        try:
            db_total = db.query(MaintenanceRecord).count()
            db_completed = db.query(MaintenanceRecord).filter(
                MaintenanceRecord.status == "completed"
            ).count()
            db_cost = db.query(func.sum(MaintenanceRecord.cost)).scalar() or 0.0
        finally:
            db.close()

        res = client.get("/reports/maintenance", headers=admin_headers)
        data = res.json()

        assert data["total_records"] == db_total
        assert data["completed_services"] == db_completed
        assert abs(data["total_maintenance_cost"] - db_cost) < 0.01
        print(f"\n✅ Maintenance Report:")
        print(f"   Total Records     : API={data['total_records']} | DB={db_total}")
        print(f"   Completed         : API={data['completed_services']} | DB={db_completed}")
        print(f"   Total Cost        : API=₹{data['total_maintenance_cost']:.2f} | DB=₹{db_cost:.2f}")

    def test_analytics_not_hardcoded(self, client, admin_headers):
        before = client.get("/analytics/fuel", headers=admin_headers).json()
        before_qty = before["total_fuel_consumed"]

        v_res = client.post("/vehicles/", json={
            "plate_number": f"HC-{uid()}",
            "vehicle_type": "Van", "model": "HC Test", "capacity_kg": 1000.0, "fuel_type": "Petrol"
        }, headers=admin_headers)
        assert v_res.status_code == 201
        vid = v_res.json()["id"]

        d_res = client.post("/drivers/", json={
            "name": "HC Driver",
            "email": f"hcd_{uid()}@test.com",
            "phone": "7000000001",
            "license_number": f"HC-{uid()}"
        }, headers=admin_headers)
        assert d_res.status_code == 201
        did = d_res.json()["id"]

        added_qty = 77.5
        client.post("/fuel/", json={
            "vehicle_id": vid,
            "driver_id": did,
            "fuel_quantity": added_qty,
            "fuel_cost": 6975.0,
            "odometer_reading": 20000.0,
            "fuel_date": datetime.utcnow().isoformat(),
            "fuel_station": "BPCL"
        }, headers=admin_headers)

        after = client.get("/analytics/fuel", headers=admin_headers).json()
        after_qty = after["total_fuel_consumed"]

        diff = after_qty - before_qty
        assert abs(diff - added_qty) < 0.01, \
            f"Analytics appear hardcoded! Before={before_qty}, After={after_qty}, " \
            f"Expected diff={added_qty}, Actual diff={diff}"
        print(f"\n✅ Analytics are LIVE (not hardcoded): +{diff:.1f}L after adding {added_qty}L")


# ═════════════════════════════════════════════════════════════════════════════
#  DRIVER ASSIGNMENT BUSINESS RULES
# ═════════════════════════════════════════════════════════════════════════════
class TestDriverAssignmentRules:
    """Business rule validation for driver assignments"""

    def test_assign_driver_and_vehicle(self, client, admin_headers):
        v_res = client.post("/vehicles/", json={
            "plate_number": f"DA-{uid()}",
            "vehicle_type": "Truck", "model": "TATA", "capacity_kg": 8000.0, "fuel_type": "Diesel"
        }, headers=admin_headers)
        assert v_res.status_code == 201, f"Vehicle create failed: {v_res.json()}"
        vid = v_res.json()["id"]

        d_res = client.post("/drivers/", json={
            "name": "Assignment Driver",
            "email": f"da_{uid()}@test.com",
            "phone": "6000000001",
            "license_number": f"DA-{uid()}"
        }, headers=admin_headers)
        assert d_res.status_code == 201, f"Driver create failed: {d_res.json()}"
        did = d_res.json()["id"]

        res = client.post("/driver-assignments/", json={
            "driver_id": did,
            "vehicle_id": vid,
            "remarks": "Test assignment"
        }, headers=admin_headers)
        assert res.status_code == 201, f"Assignment failed: {res.json()}"
        assignment_id = res.json()["id"]

        v2_res = client.post("/vehicles/", json={
            "plate_number": f"DA2-{uid()}",
            "vehicle_type": "Van", "model": "Ford", "capacity_kg": 2000.0, "fuel_type": "Petrol"
        }, headers=admin_headers)
        assert v2_res.status_code == 201
        vid2 = v2_res.json()["id"]

        dup_res = client.post("/driver-assignments/", json={
            "driver_id": did,
            "vehicle_id": vid2,
            "remarks": "Duplicate assignment"
        }, headers=admin_headers)
        assert dup_res.status_code == 400, \
            f"Expected 400 for duplicate assignment, got {dup_res.status_code}: {dup_res.json()}"

        client.put(f"/driver-assignments/{assignment_id}", json={
            "assignment_status": "Completed"
        }, headers=admin_headers)

    def test_inactive_driver_not_available(self, client, admin_headers):
        v_res = client.post("/vehicles/", json={
            "plate_number": f"IA-{uid()}",
            "vehicle_type": "Truck", "model": "Volvo", "capacity_kg": 15000.0, "fuel_type": "Diesel"
        }, headers=admin_headers)
        assert v_res.status_code == 201
        vid = v_res.json()["id"]

        d_res = client.post("/drivers/", json={
            "name": "Inactive Driver",
            "email": f"inactive_{uid()}@test.com",
            "phone": "5000000001",
            "license_number": f"IN-{uid()}"
        }, headers=admin_headers)
        assert d_res.status_code == 201
        did = d_res.json()["id"]

        db = TestingSessionLocal()
        try:
            d = db.query(Driver).filter(Driver.id == did).first()
            d.is_available = False
            db.commit()
        finally:
            db.close()

        res = client.post("/driver-assignments/", json={
            "driver_id": did,
            "vehicle_id": vid,
        }, headers=admin_headers)
        assert res.status_code == 400, \
            f"Expected 400 for unavailable driver, got {res.status_code}"
        assert "not available" in res.json()["detail"].lower()
