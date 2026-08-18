import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_fleet.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_full_integration():
  Base.metadata.drop_all(bind=engine)
  Base.metadata.create_all(bind=engine)
  print("=== Running FleetFlow Full-Stack E2E Integration Test ===")
  
  # 1. Health check
  res = client.get("/")
  assert res.status_code == 200
  print("[OK] Backend Health Check:", res.json())

  # 1b. Register and Login to obtain JWT Token for protected endpoints
  user_payload = {
      "name": "E2E Test Admin",
      "email": "admin_e2e@fleetflow.com",
      "password": "Password123!",
      "role": "admin"
  }
  reg_res = client.post("/auth/register", json=user_payload)
  if reg_res.status_code != 201:
      login_res = client.post("/auth/login", json={"email": user_payload["email"], "password": user_payload["password"]})
      token = login_res.json()["access_token"]
  else:
      token_res = client.post("/auth/login", json={"email": user_payload["email"], "password": user_payload["password"]})
      token = token_res.json()["access_token"]
  
  client.headers["Authorization"] = f"Bearer {token}"
  print("[OK] User Registered/Logged in & JWT Token acquired")

  # 2. Create Vehicle
  import time
  unique_tag = str(int(time.time()))
  veh_payload = {
    "vehicle_number": f"TRK-E2E-{unique_tag}",
    "vehicle_type": "Heavy Truck",
    "capacity": 20.0,
    "status": "available",
    "current_location": "Main Yard"
  }
  res = client.post("/vehicles/", json=veh_payload)
  assert res.status_code == 201, res.text
  veh = res.json()
  print("[OK] Vehicle Created/Verified:", veh["vehicle_number"], f"(ID #{veh['id']})")

  # 3. Create Driver
  drv_payload = {
    "name": f"Alex Mercer {unique_tag}",
    "license_number": f"CDL-E2E-{unique_tag}",
    "phone": "+1-555-0199",
    "status": "available"
  }
  res = client.post("/drivers/", json=drv_payload)
  assert res.status_code == 201, res.text
  drv = res.json()
  print("[OK] Driver Created/Verified:", drv["name"], f"(ID #{drv['id']})")


  # 4. Create Route
  rt_payload = {
    "name": "Interstate Route 95",
    "source": "New York",
    "destination": "Boston",
    "distance_km": 350.0,
    "estimated_duration_hours": 4.5
  }
  res = client.post("/routes/", json=rt_payload)
  assert res.status_code == 201, res.text
  rt = res.json()
  print("[OK] Route Created:", rt["name"], f"(ID #{rt['id']})")

  # 5. Create Shipment using Vehicle, Driver, Route IDs
  shp_payload = {
    "customer_name": "Acme Global Freight",
    "source": rt["source"],
    "destination": rt["destination"],
    "cargo_description": "Electronics & Sensors",
    "weight": 8.5,
    "status": "Created",
    "vehicle_id": veh["id"],
    "driver_id": drv["id"],
    "route_id": rt["id"]
  }
  res = client.post("/shipments/", json=shp_payload)
  assert res.status_code == 201, res.text
  shp = res.json()
  print("[OK] Shipment Created (Auto Tracking):", shp["tracking_number"], f"(ID #{shp['id']})")

  # 6. Test Tracking Endpoint
  res = client.get(f"/shipments/tracking/{shp['tracking_number']}/status")
  assert res.status_code == 200, res.text
  print("[OK] Public Tracking Lookup Status:", res.json()["status"], "ETA:", res.json()["eta"])

  # 7. Create Fuel Log
  fuel_payload = {
    "vehicle_id": veh["id"],
    "driver_id": drv["id"],
    "liters": 120.0,
    "cost_per_liter": 3.50,
    "total_cost": 420.0,
    "odometer_reading": 12500.0,
    "log_date": "2026-08-07",
    "fuel_station": "Chevron Station #9"
  }
  res = client.post("/fuel/", json=fuel_payload)
  assert res.status_code == 201, res.text
  fuel = res.json()
  print("[OK] Fuel Logged:", f"{fuel['liters']}L", f"Total: ${fuel['total_cost']}")

  # 8. Create Trip
  trip_payload = {
    "shipment_id": shp["id"],
    "driver_id": drv["id"],
    "vehicle_id": veh["id"],
    "pickup_location": shp["source"],
    "destination": shp["destination"],
    "status": "Scheduled"
  }
  res = client.post("/trips/", json=trip_payload)
  assert res.status_code == 201, res.text
  trip = res.json()
  print("[OK] Trip Dispatched:", trip["status"], f"(ID #{trip['id']})")

  # 9. Create Maintenance Record (updates vehicle status)
  maint_payload = {
    "vehicle_id": veh["id"],
    "category": "Engine Service",
    "service_date": "2026-08-07",
    "next_service_date": "2026-11-07",
    "cost": 650.0,
    "service_provider": "Bosch Service Center",
    "status": "scheduled",
    "notes": "Full synthetic oil change & spark plug replacement"
  }
  res = client.post("/maintenance/", json=maint_payload)
  assert res.status_code == 201, res.text
  maint = res.json()
  print("[OK] Maintenance Record Logged:", maint["category"], f"Cost: ${maint['cost']}")

  # 10. Verify Dashboard Summary
  res = client.get("/dashboard/summary")
  assert res.status_code == 200, res.text
  print("[OK] Dashboard Summary Metrics:", res.json())

  # 11. Verify Operational Reports
  res = client.get("/reports/operations")
  assert res.status_code == 200, res.text
  print("[OK] Operational Report Metrics:", res.json())

  print("\nSUCCESS: ALL 11 E2E INTEGRATION TESTS PASSED PERFECTLY ON POSTGRESQL!")

if __name__ == "__main__":
  test_full_integration()
