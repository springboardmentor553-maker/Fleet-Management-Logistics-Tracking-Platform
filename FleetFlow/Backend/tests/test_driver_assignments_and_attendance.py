from fastapi.testclient import TestClient
from datetime import datetime
import pytest

from app.main import app
from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.driver_assignment import DriverAssignment
from app.utils.security import hash_password, create_access_token


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_headers():
    db = SessionLocal()
    admin_email = "admin_test_assignment@fleetflow.com"
    user = db.query(User).filter(User.email == admin_email).first()
    if not user:
        user = User(
            name="Admin Test Assignment",
            email=admin_email,
            hashed_password=hash_password("password123"),
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()

    token = create_access_token(data={"sub": admin_email, "role": "admin"})
    db.close()
    return {"Authorization": f"Bearer {token}"}


def test_driver_assignment_without_trip_id(client, auth_headers):
    db = SessionLocal()
    d = Driver(name="Test Driver Assignment", email="testdriver_assign@fleetflow.com", phone="1234567890", license_number="LIC-ASSIGN-01", is_available=True)
    v = Vehicle(plate_number="TN-99-ASSN-1", vehicle_type="Truck", model="Volvo", capacity_kg=5000.0, fuel_type="Diesel", current_status="available")
    db.add(d)
    db.add(v)
    db.commit()
    d_id = d.id
    v_id = v.id
    db.close()

    # Assign without trip_id
    payload = {
        "driver_id": d_id,
        "vehicle_id": v_id,
        "remarks": "Assigned without pre-existing trip ID",
    }
    response = client.post("/driver-assignments/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["driver_id"] == d_id
    assert data["vehicle_id"] == v_id
    assert data["trip_id"] is None
    assert data["assignment_status"] == "Assigned"

    # Verify automatic driver and vehicle status updates
    db2 = SessionLocal()
    d_updated = db2.query(Driver).filter(Driver.id == d_id).first()
    v_updated = db2.query(Vehicle).filter(Vehicle.id == v_id).first()
    assert d_updated.is_available is False
    assert v_updated.current_status == "in_transit"
    db2.close()

    # Attempting to assign unavailable driver again should fail
    response2 = client.post("/driver-assignments/", json=payload, headers=auth_headers)
    assert response2.status_code == 400

    # Unassign / Complete assignment
    assignment_id = data["id"]
    update_res = client.put(f"/driver-assignments/{assignment_id}", json={"assignment_status": "Completed"}, headers=auth_headers)
    assert update_res.status_code == 200

    db3 = SessionLocal()
    d_cleared = db3.query(Driver).filter(Driver.id == d_id).first()
    v_cleared = db3.query(Vehicle).filter(Vehicle.id == v_id).first()
    assert d_cleared.is_available is True
    assert v_cleared.current_status == "available"
    db3.close()


def test_driver_performance_endpoint(client, auth_headers):
    db = SessionLocal()
    d = Driver(name="Perf Driver", email="perfdriver@fleetflow.com", phone="9998887776", license_number="LIC-PERF-01", is_available=True)
    v = Vehicle(plate_number="TN-99-PERF-1", vehicle_type="Van", model="Tata", capacity_kg=2000.0, fuel_type="Diesel", current_status="available")
    db.add(d)
    db.add(v)
    db.commit()
    d_id = d.id
    v_id = v.id

    s = Shipment(origin="Chennai", destination="Bangalore", weight_kg=100.0, status="in_transit")
    db.add(s)
    db.commit()

    t1 = Trip(shipment_id=s.id, driver_id=d_id, vehicle_id=v_id, status="completed")
    t2 = Trip(shipment_id=s.id, driver_id=d_id, vehicle_id=v_id, status="started")
    db.add(t1)
    db.add(t2)
    db.commit()
    db.close()

    # Test GET /driver/{driver_id}/performance
    response = client.get(f"/driver/{d_id}/performance", headers=auth_headers)
    assert response.status_code == 200
    perf = response.json()
    assert perf["driver_id"] == d_id
    assert perf["total_trips"] == 2
    assert perf["completed_trips"] == 1
    assert perf["active_trips"] == 1
    assert perf["cancelled_trips"] == 0
