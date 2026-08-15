import os
import sys
import json
import requests
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.utils.auth import create_access_token
from app.database import SessionLocal
from app.models.user import User

BASE_URL = "http://127.0.0.1:8000"

def main():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "admin@fleetflow.com").first()
    if not user:
        print("Admin user not found!")
        return

    token = create_access_token(subject=user.email)
    headers = {"Authorization": f"Bearer {token}"}
    
    print("--- Phase 3: Trip Assignment E2E ---")
    
    # Create shipment
    shipment_data = {
        "shipment_number": "SHP-E2E-01",
        "tracking_number": "TRK-E2E-01",
        "sender_name": "QA Dept",
        "sender_address": "QA HQ",
        "receiver_name": "Client",
        "receiver_address": "Destination",
        "pickup_location": "QA HQ",
        "delivery_location": "Destination",
        "weight_kg": 150.0,
        "volume_m3": 2.5
    }
    ship = requests.post(f"{BASE_URL}/shipments", json=shipment_data, headers=headers)
    assert ship.status_code == 201, f"Failed to create shipment: {ship.text}"
    ship_id = ship.json()["id"]
    print(f"Created Shipment ID {ship_id}")
    
    # Create trip
    trip_data = {
        "shipment_id": ship_id,
        "start_location": "QA HQ",
        "end_location": "Destination"
    }
    trip = requests.post(f"{BASE_URL}/trips", json=trip_data, headers=headers)
    assert trip.status_code == 201, f"Failed to create trip: {trip.text}"
    trip_id = trip.json()["id"]
    print(f"Created Trip ID {trip_id}")
    
    # Get available driver and vehicle
    drivers = requests.get(f"{BASE_URL}/drivers", headers=headers).json()
    available_drivers = [d for d in drivers if d["status"] == "AVAILABLE"]
    if not available_drivers:
        print("No available drivers. Exiting.")
        return
    driver_id = available_drivers[0]["id"]
    
    vehicles = requests.get(f"{BASE_URL}/vehicles", headers=headers).json()
    available_vehicles = [v for v in vehicles if v["status"] == "ACTIVE"]
    if not available_vehicles:
        print("No active vehicles. Exiting.")
        return
    vehicle_id = available_vehicles[0]["id"]
    
    print(f"Assigning Driver {driver_id} and Vehicle {vehicle_id} to Trip {trip_id}")
    assign_resp = requests.put(f"{BASE_URL}/trips/{trip_id}", json={
        "driver_id": driver_id,
        "vehicle_id": vehicle_id,
        "trip_status": "ASSIGNED"
    }, headers=headers)
    
    assert assign_resp.status_code == 200, f"Failed to assign: {assign_resp.text}"
    
    print("Checking DriverAssignments endpoint...")
    assignments = requests.get(f"{BASE_URL}/driver-assignments/trip/{trip_id}", headers=headers).json()
    assert assignments, "No assignments generated from trip update!"
    assert assignments[0]["driver_id"] == driver_id
    assert assignments[0]["vehicle_id"] == vehicle_id
    print("Assignment cascading verified.")
    
    print("\n--- Phase 7: Activity Feed Verification ---")
    activities = requests.get(f"{BASE_URL}/dashboard/activities", headers=headers).json()
    found_trip_assigned = any(a["id"] == f"t-{trip_id}-assigned" for a in activities)
    found_shipment_created = any(a["id"] == f"s-{ship_id}" for a in activities)
    
    assert found_trip_assigned, "Trip Assigned event missing from activity feed"
    assert found_shipment_created, "Shipment Created event missing from activity feed"
    print("Activity feed verified.")
    
    print("\nALL VERIFICATIONS PASSED!")
    
if __name__ == "__main__":
    main()
