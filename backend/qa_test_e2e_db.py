import os
import sys
import json
import requests

# Add backend directory to sys.path
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
    
    print("--- Fetching Dashboards ---")
    dash = requests.get(f"{BASE_URL}/dashboard", headers=headers).json()
    fleet = requests.get(f"{BASE_URL}/dashboard/fleet", headers=headers).json()
    ops = requests.get(f"{BASE_URL}/analytics/operations", headers=headers).json()
    fuel = requests.get(f"{BASE_URL}/analytics/fuel", headers=headers).json()
    maint_reports = requests.get(f"{BASE_URL}/reports/maintenance", headers=headers).json()
    
    print("Main Dashboard:", {k:v for k,v in dash.items() if not isinstance(v, (list, dict))})
    print("Fleet Dashboard:", fleet)
    print("Operations:", ops)
    print("Fuel Analytics:", fuel)
    print("Maintenance Reports:", {k:v for k,v in maint_reports.items() if not isinstance(v, (list, dict))})
    
    print("\n--- Verifying Consistency ---")
    assert dash["totalVehicles"] == fleet["total_vehicles"], f"totalVehicles mismatch {dash['totalVehicles']} != {fleet['total_vehicles']}"
    assert dash["active"] == fleet["active_vehicles"], f"active mismatch {dash['active']} != {fleet['active_vehicles']}"
    assert dash["maintenance"] == fleet["vehicles_under_maintenance"], f"maint mismatch {dash['maintenance']} != {fleet['vehicles_under_maintenance']}"
    
    assert dash["totalDrivers"] == fleet["total_drivers"], "totalDrivers mismatch"
    assert dash["availableDrivers"] == fleet["available_drivers"], "availableDrivers mismatch"
    assert dash["assignedDrivers"] == fleet["assigned_drivers"], "assignedDrivers mismatch"
    
    assert dash["activeDeliveries"] == fleet["active_shipments"], "activeDeliveries mismatch"
    assert dash["totalShipments"] == ops["total_deliveries"], "totalShipments mismatch"
    
    print("Dashboard Consistency PASSED!")

if __name__ == "__main__":
    main()
