import os
import sys
import json
import requests
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.utils.auth import create_access_token

token = create_access_token(subject='admin@fleetflow.com')
headers = {"Authorization": f"Bearer {token}"}
BASE_URL = "http://127.0.0.1:8000"

def seed_data():
    print("Finding available driver and vehicle...")
    drivers = requests.get(f"{BASE_URL}/drivers", headers=headers).json()
    vehicles = requests.get(f"{BASE_URL}/vehicles", headers=headers).json()
    
    available_drivers = drivers
    active_vehicles = vehicles
    
    if not available_drivers or not active_vehicles:
        print("No drivers or vehicles to create records with.")
        return
        
    driver_id = available_drivers[0]["id"]
    vehicle_id = active_vehicles[0]["id"]
    
    print(f"Creating Attendance record for Driver {driver_id}...")
    att_resp = requests.post(f"{BASE_URL}/attendance", json={
        "driver_id": driver_id,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "status": "PRESENT"
    }, headers=headers)
    print("Attendance creation:", att_resp.status_code, att_resp.text)
    
    print(f"Creating Trip and Assignment for Driver {driver_id} and Vehicle {vehicle_id}...")
    ship_resp = requests.post(f"{BASE_URL}/shipments", json={
        "shipment_number": "SHP-UI-TEST",
        "tracking_number": "TRK-UI-TEST",
        "sender_name": "Test",
        "sender_address": "Test",
        "receiver_name": "Test",
        "receiver_address": "Test",
        "pickup_location": "New York, NY",
        "delivery_location": "Los Angeles, CA",
        "weight_kg": 10.0,
        "volume_m3": 1.0
    }, headers=headers)
    
    if ship_resp.status_code == 201:
        ship_id = ship_resp.json()["id"]
        trip_resp = requests.post(f"{BASE_URL}/trips", json={
            "shipment_id": ship_id,
            "start_location": "New York, NY",
            "end_location": "Los Angeles, CA",
            "distance_km": 10.0,
            "estimated_duration": "1h",
            "pickup_location": "New York, NY",
            "destination": "Los Angeles, CA",
            "scheduled_start_time": datetime.now().isoformat(),
            "scheduled_end_time": datetime.now().isoformat(),
            "driver_id": driver_id,
            "vehicle_id": vehicle_id
        }, headers=headers)
        
        if trip_resp.status_code == 201:
            trip_id = trip_resp.json()["id"]
            assign_resp = requests.put(f"{BASE_URL}/trips/{trip_id}", json={
                "driver_id": driver_id,
                "vehicle_id": vehicle_id,
                "trip_status": "ASSIGNED"
            }, headers=headers)
            print("Trip assignment update:", assign_resp.status_code, assign_resp.text)
        else:
            print("Failed to create trip:", trip_resp.text)

if __name__ == "__main__":
    seed_data()
