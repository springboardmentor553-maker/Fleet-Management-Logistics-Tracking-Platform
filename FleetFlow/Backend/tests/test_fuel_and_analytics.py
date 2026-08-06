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
from app.models.fuel import FuelRecord
from app.utils.security import hash_password, create_access_token


@pytest.fixture(scope="module")
def client():
    # Make sure DB is initialized
    init_db()
    
    # Create clean session for setting up test data
    db = SessionLocal()
    
    # Setup test admin user if it doesn't exist
    admin_email = "testadmin@fleetflow.com"
    user = db.query(User).filter(User.email == admin_email).first()
    if not user:
        user = User(
            name="Test Admin",
            email=admin_email,
            hashed_password=hash_password("adminpassword"),
            role="admin",
            is_active=True
        )
        db.add(user)
    
    # Create test driver
    driver = db.query(Driver).filter(Driver.email == "testdriver@fleetflow.com").first()
    if not driver:
        driver = Driver(
            name="Test Driver",
            email="testdriver@fleetflow.com",
            phone="+91 99999 88888",
            license_number="DL-TEST-9999",
            is_available=True,
            attendance_status="present",
            safety_score=98,
            completed_trips_count=5,
            total_distance_km=120.5,
            rating=4.9
        )
        db.add(driver)
        db.commit()
        db.refresh(driver)
    
    # Create test vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.plate_number == "TN-01-XX-9999").first()
    if not vehicle:
        vehicle = Vehicle(
            plate_number="TN-01-XX-9999",
            vehicle_type="Truck",
            model="Tata Ace",
            capacity_kg=1200.0,
            fuel_type="Diesel",
            assigned_driver_id=driver.id,
            current_status="available"
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
    
    # Assign vehicle to driver
    driver.assigned_vehicle_id = vehicle.id
    db.commit()

    db.close()

    # Generate token
    token = create_access_token({"sub": admin_email})
    c = TestClient(app)
    c.headers.update({"Authorization": f"Bearer {token}"})
    yield c

    # Cleanup test data
    db = SessionLocal()
    db.query(FuelRecord).delete()
    db.query(Trip).delete()
    db.query(Shipment).delete()
    db.commit()
    db.close()


def test_create_fuel_record_success(client):
    # Retrieve vehicle and driver IDs
    db = SessionLocal()
    v = db.query(Vehicle).filter(Vehicle.plate_number == "TN-01-XX-9999").first()
    d = db.query(Driver).filter(Driver.email == "testdriver@fleetflow.com").first()
    db.close()

    payload = {
        "vehicle_id": v.id,
        "driver_id": d.id,
        "fuel_quantity": 45.5,
        "fuel_cost": 4500.0,
        "odometer_reading": 15200.0,
        "fuel_station": "Indian Oil Station",
        "remarks": "Regular top-up"
    }

    response = client.post("/fuel/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["fuel_quantity"] == 45.5
    assert data["fuel_cost"] == 4500.0
    assert data["fuel_station"] == "Indian Oil Station"
    assert data["remarks"] == "Regular top-up"
    assert data["vehicle_id"] == v.id
    assert data["driver_id"] == d.id


def test_create_fuel_record_validation_errors(client):
    db = SessionLocal()
    v = db.query(Vehicle).filter(Vehicle.plate_number == "TN-01-XX-9999").first()
    d = db.query(Driver).filter(Driver.email == "testdriver@fleetflow.com").first()
    db.close()

    # 1. Non-existent vehicle ID
    payload = {
        "vehicle_id": 999999,
        "driver_id": d.id,
        "fuel_quantity": 45.5,
        "fuel_cost": 4500.0,
        "odometer_reading": 15200.0,
        "fuel_station": "IOCL"
    }
    response = client.post("/fuel/", json=payload)
    assert response.status_code == 404
    assert "Vehicle with ID" in response.json()["detail"]

    # 2. Non-existent driver ID
    payload = {
        "vehicle_id": v.id,
        "driver_id": 999999,
        "fuel_quantity": 45.5,
        "fuel_cost": 4500.0,
        "odometer_reading": 15200.0,
        "fuel_station": "IOCL"
    }
    response = client.post("/fuel/", json=payload)
    assert response.status_code == 404
    assert "Driver with ID" in response.json()["detail"]

    # 3. Fuel quantity <= 0
    payload = {
        "vehicle_id": v.id,
        "driver_id": d.id,
        "fuel_quantity": 0,
        "fuel_cost": 4500.0,
        "odometer_reading": 15200.0,
        "fuel_station": "IOCL"
    }
    response = client.post("/fuel/", json=payload)
    assert response.status_code == 422 or response.status_code == 400

    # 4. Fuel cost <= 0
    payload = {
        "vehicle_id": v.id,
        "driver_id": d.id,
        "fuel_quantity": 45.5,
        "fuel_cost": -10.0,
        "odometer_reading": 15200.0,
        "fuel_station": "IOCL"
    }
    response = client.post("/fuel/", json=payload)
    assert response.status_code == 422 or response.status_code == 400


def test_view_all_fuel_records(client):
    response = client.get("/fuel/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


def test_get_fuel_record_by_id(client):
    db = SessionLocal()
    rec = db.query(FuelRecord).first()
    db.close()

    response = client.get(f"/fuel/{rec.id}")
    assert response.status_code == 200
    assert response.json()["id"] == rec.id


def test_update_fuel_record(client):
    db = SessionLocal()
    rec = db.query(FuelRecord).first()
    db.close()

    payload = {
        "fuel_quantity": 55.0,
        "remarks": "Updated top-up remarks"
    }
    response = client.put(f"/fuel/{rec.id}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["fuel_quantity"] == 55.0
    assert data["remarks"] == "Updated top-up remarks"


def test_fuel_analytics(client):
    db = SessionLocal()
    # Ensure multiple records exist to verify min/max calculation
    v = db.query(Vehicle).filter(Vehicle.plate_number == "TN-01-XX-9999").first()
    d = db.query(Driver).filter(Driver.email == "testdriver@fleetflow.com").first()

    # Create a secondary vehicle with more usage
    v2 = db.query(Vehicle).filter(Vehicle.plate_number == "TN-02-XX-8888").first()
    if not v2:
        v2 = Vehicle(
            plate_number="TN-02-XX-8888",
            vehicle_type="Van",
            model="Mahindra Supro",
            capacity_kg=800.0,
            fuel_type="Petrol",
            assigned_driver_id=d.id,
            current_status="available"
        )
        db.add(v2)
        db.commit()
        db.refresh(v2)

    # Capture IDs before closing db session (detached instance access fails)
    v_id = v.id
    v2_id = v2.id

    # Insert test fueling data
    db.query(FuelRecord).delete()
    
    rec1 = FuelRecord(vehicle_id=v_id, driver_id=d.id, fuel_quantity=10.0, fuel_cost=1000.0, odometer_reading=100.0, fuel_station="Station A")
    rec2 = FuelRecord(vehicle_id=v2_id, driver_id=d.id, fuel_quantity=100.0, fuel_cost=10000.0, odometer_reading=500.0, fuel_station="Station B")
    db.add(rec1)
    db.add(rec2)
    db.commit()
    db.close()

    response = client.get("/analytics/fuel")
    assert response.status_code == 200
    data = response.json()
    assert data["total_fuel_consumed"] == 110.0
    assert data["total_fuel_cost"] == 11000.0
    assert data["average_fuel_consumption"] == 55.0
    assert data["vehicle_highest_usage"]["vehicle_id"] == v2_id
    assert data["vehicle_lowest_usage"]["vehicle_id"] == v_id


def test_fleet_performance_dashboard(client):
    response = client.get("/dashboard/fleet")
    assert response.status_code == 200
    data = response.json()
    assert "total_vehicles" in data
    assert "active_vehicles" in data
    assert "total_drivers" in data
    assert "available_drivers" in data
    assert "assigned_drivers" in data
    assert "total_trips" in data
    assert "completed_trips" in data
    assert "active_shipments" in data


def test_operational_analytics(client):
    db = SessionLocal()
    # Create test shipments & trips
    v = db.query(Vehicle).filter(Vehicle.plate_number == "TN-01-XX-9999").first()
    d = db.query(Driver).filter(Driver.email == "testdriver@fleetflow.com").first()

    db.query(Trip).delete()
    db.query(Shipment).delete()

    # Shipment 1: Delivered
    s1 = Shipment(
        origin="Chennai",
        destination="Mumbai",
        weight_kg=150.0,
        status="delivered",
        driver_id=d.id,
        vehicle_id=v.id,
        created_at=datetime(2026, 1, 1, 10, 0),
        delivered_at=datetime(2026, 1, 1, 14, 0) # 4 hours delivery time
    )
    # Shipment 2: Cancelled
    s2 = Shipment(
        origin="Bangalore",
        destination="Delhi",
        weight_kg=300.0,
        status="cancelled",
        driver_id=d.id,
        vehicle_id=v.id,
        created_at=datetime(2026, 1, 2, 10, 0)
    )
    # Shipment 3: Delayed delivery (Created long time ago and still in_transit)
    s3 = Shipment(
        origin="Kolkata",
        destination="Pune",
        weight_kg=200.0,
        status="in_transit",
        driver_id=d.id,
        vehicle_id=v.id,
        created_at=datetime(2020, 1, 1, 10, 0)
    )

    db.add(s1)
    db.add(s2)
    db.add(s3)
    db.commit()
    db.refresh(s1)
    db.refresh(s2)
    db.refresh(s3)

    t1 = Trip(
        shipment_id=s1.id,
        driver_id=d.id,
        vehicle_id=v.id,
        pickup_latitude=13.0827,
        pickup_longitude=80.2707,
        destination_latitude=19.0760,
        destination_longitude=72.8777,
        status="completed"
    )
    db.add(t1)
    db.commit()
    db.close()

    response = client.get("/analytics/operations")
    assert response.status_code == 200
    data = response.json()
    assert data["total_deliveries"] == 3
    assert data["successful_deliveries"] == 1
    assert data["cancelled_deliveries"] == 1
    assert data["delayed_deliveries"] == 1 # s3 is in_transit from 2020
    assert data["average_delivery_time"] == 4.0 # 4 hours
    assert data["average_trip_distance"] > 0.0 # Chennai to Mumbai distance
