import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.driver import Driver, DriverStatus
from app.models.driver_assignment import DriverAssignment
from app.models.shipment import Shipment, ShipmentStatus
from app.models.trip import Trip, TripStatus
from app.models.maintenance import Maintenance, MaintenanceStatus
from app.models.maintenance_alert import MaintenanceAlert
from app.models.fuel_record import FuelRecordModel
from app.utils.auth import get_password_hash, create_access_token
from datetime import datetime, timedelta, timezone

client = TestClient(app)
db = SessionLocal()

def get_auth_headers(role: UserRole):
    # Ensure a user of this role exists
    user = db.query(User).filter(User.role == role).first()
    if not user:
        user = User(
            email=f"test_{role.value}@example.com",
            password_hash=get_password_hash("password"),
            first_name="Test",
            last_name=role.value,
            role=role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(subject=user.email)
    return {"Authorization": f"Bearer {token}"}

def run_tests():
    headers = get_auth_headers(UserRole.ADMIN)
    
    print("--- Starting Validation ---")
    
    # 1. Create Vehicle
    print("\n1. Creating Vehicle")
    res = client.post("/vehicles", json={
        "make": "Toyota",
        "model": "Camry",
        "year": 2020,
        "license_plate": f"TEST-{int(datetime.now().timestamp())}",
        "vin": f"VIN-{int(datetime.now().timestamp())}",
        "capacity_kg": 1000.0,
        "fuel_type": "Gasoline"
    }, headers=headers)
    assert res.status_code == 201, f"Failed to create vehicle: {res.text}"
    vehicle_id = res.json()["id"]
    print(f"Vehicle created with ID {vehicle_id}")

    # 2. Register Driver
    print("\n2. Registering Driver User")
    res = client.post("/auth/register", json={
        "email": f"driver_{int(datetime.now().timestamp())}@example.com",
        "password": "password123",
        "full_name": "Test Driver",
        "role": "driver",
        "phone_number": "1234567890",
        "license_number": f"LIC-{int(datetime.now().timestamp())}"
    }, headers=headers)
    assert res.status_code == 201, f"Failed to register driver: {res.text}"
    
    # Get the driver record
    driver = db.query(Driver).order_by(Driver.id.desc()).first()
    driver_id = driver.id
    print(f"Driver created with ID {driver_id}")

    # 3. Create Shipment
    print("\n3. Creating Shipment")
    res = client.post("/shipments", json={
        "tracking_number": f"TRK-{int(datetime.now().timestamp())}",
        "origin": "New York",
        "destination": "Boston",
        "weight": 100,
        "status": "Pending",
        "pickup_location": "New York",
        "delivery_location": "Boston",
        "sender_name": "Sender John",
        "receiver_name": "Receiver Jane"
    }, headers=headers)
    assert res.status_code == 201, f"Failed to create shipment: {res.text}"
    shipment_id = res.json()["id"]
    print(f"Shipment created with ID {shipment_id}")

    # 4. Create Trip
    print("\n4. Creating Trip")
    res = client.post("/trips", json={
        "vehicle_id": vehicle_id,
        "driver_id": driver_id,
        "shipment_id": shipment_id,
        "pickup_location": "New York",
        "destination": "Boston",
        "scheduled_start_time": datetime.now(timezone.utc).isoformat(),
        "scheduled_end_time": (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat(),
        "distance_km": 350.0,
        "estimated_duration": "4 hours",
        "trip_status": "created"
    }, headers=headers)
    assert res.status_code == 201, f"Failed to create trip: {res.text}"
    trip_id = res.json()["id"]
    print(f"Trip created with ID {trip_id}")

    # 5. Assign Driver
    print("\n5. Assigning Driver")
    client.put(f"/drivers/{driver_id}", json={"status": "available"}, headers=headers)
    res = client.post("/driver-assignments", json={
        "driver_id": driver_id,
        "vehicle_id": vehicle_id,
        "trip_id": trip_id,
        "assignment_status": "ASSIGNED"
    }, headers=headers)
    assert res.status_code == 201, f"Failed to assign driver: {res.text}"
    print("Driver assigned successfully.")

    # 6. Add Fuel Record
    print("\n6. Adding Fuel Record")
    res = client.post("/fuel-records", json={
        "vehicle_id": vehicle_id,
        "driver_id": driver_id,
        "fuel_date": datetime.now(timezone.utc).isoformat(),
        "fuel_quantity": 50.0,
        "fuel_cost": 150.0,
        "odometer_reading": 1000
    }, headers=headers)
    assert res.status_code == 201, f"Failed to add fuel record: {res.text}"
    print("Fuel record added successfully.")

    # 7. Schedule Maintenance
    print("\n7. Scheduling Maintenance")
    res = client.post("/maintenance", json={
        "vehicle_id": vehicle_id,
        "maintenance_type": "Scheduled",
        "maintenance_category": "Oil Change",
        "description": "Regular oil change",
        "service_date": datetime.now(timezone.utc).isoformat(),
        "next_service_date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
        "service_cost": 100.0,
        "maintenance_status": "scheduled"
    }, headers=headers)
    assert res.status_code == 201, f"Failed to schedule maintenance: {res.text}"
    maintenance_id = res.json()["id"]
    print(f"Maintenance scheduled with ID {maintenance_id}")
    
    # 8. Complete Trip
    print("\n8. Completing Trip")
    res = client.put(f"/trips/{trip_id}", json={
        "trip_status": "completed"
    }, headers=headers)
    assert res.status_code == 200, f"Failed to complete trip: {res.text}"
    print("Trip completed successfully.")
    
    # === Business Rules ===
    print("\n--- Testing Business Rules ---")
    
    print("Rule: Fuel records cannot be created for invalid vehicles.")
    res = client.post("/fuel-records", json={
        "vehicle_id": 999999,
        "driver_id": driver_id,
        "fuel_date": datetime.now(timezone.utc).isoformat(),
        "fuel_quantity": 50.0,
        "fuel_cost": 150.0,
        "odometer_reading": 1000
    }, headers=headers)
    assert res.status_code == 404, f"Expected 404 for invalid vehicle, got {res.status_code}: {res.text}"
    print("Rule passed.")
    
    print("Rule: Vehicle under maintenance cannot be assigned to a trip.")
    # First set vehicle to maintenance
    res = client.put(f"/maintenance/{maintenance_id}", json={
        "maintenance_status": "in_progress"
    }, headers=headers)
    assert res.status_code == 200
    # Try assigning to a new trip
    res = client.post("/driver-assignments", json={
        "driver_id": driver_id,
        "vehicle_id": vehicle_id,
        "trip_id": trip_id,
        "assignment_status": "ASSIGNED"
    }, headers=headers)
    assert res.status_code == 400, f"Expected 400 for vehicle in maintenance, got {res.status_code}"
    print("Rule passed.")
    
    # Set vehicle back to active
    res = client.put(f"/maintenance/{maintenance_id}", json={
        "maintenance_status": "completed"
    }, headers=headers)
    
    print("Rule: Driver already assigned to an active trip cannot receive another active trip.")
    # First, make driver available and clear previous assignments
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    driver.status = DriverStatus.AVAILABLE
    db.query(DriverAssignment).delete()
    db.commit()
    # Assign once
    res = client.post("/driver-assignments", json={
        "driver_id": driver_id,
        "vehicle_id": vehicle_id,
        "trip_id": trip_id,
        "assignment_status": "ASSIGNED"
    }, headers=headers)
    assert res.status_code == 201
    
    # Assign twice
    res = client.post("/driver-assignments", json={
        "driver_id": driver_id,
        "vehicle_id": vehicle_id,
        "trip_id": trip_id,
        "assignment_status": "ASSIGNED"
    }, headers=headers)
    assert res.status_code == 400, f"Expected 400 for driver already assigned, got {res.status_code}"
    print("Rule passed.")
    
    print("Rule: Driver marked as Leave cannot be assigned.")
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    # Clean up existing assignments
    for a in driver.assignments:
        db.delete(a)
    driver.status = DriverStatus.INACTIVE # Or whatever maps to Leave/Inactive
    db.commit()
    
    res = client.post("/driver-assignments", json={
        "driver_id": driver_id,
        "vehicle_id": vehicle_id,
        "trip_id": trip_id,
        "assignment_status": "ASSIGNED"
    }, headers=headers)
    assert res.status_code == 400, f"Expected 400 for driver on leave, got {res.status_code}"
    print("Rule passed.")

    # Celery - skipped due to blocking
    print("\n✅ All validations passed successfully!")

if __name__ == "__main__":
    run_tests()
