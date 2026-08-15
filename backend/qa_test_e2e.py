import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def get_token():
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@fleetflow.com", "password": "securepassword"})
    if resp.status_code != 200:
        print(f"Failed to login: {resp.text}")
        return None
    return resp.json()["access_token"]

def main():
    token = get_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Dashboard Consistency check
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
    assert dash["totalVehicles"] == fleet["total_vehicles"], "totalVehicles mismatch"
    assert dash["active"] == fleet["active_vehicles"], "activeVehicles mismatch"
    assert dash["maintenance"] == fleet["vehicles_under_maintenance"], "maintenanceVehicles mismatch"
    
    assert dash["totalDrivers"] == fleet["total_drivers"], "totalDrivers mismatch"
    assert dash["availableDrivers"] == fleet["available_drivers"], "availableDrivers mismatch"
    assert dash["assignedDrivers"] == fleet["assigned_drivers"], "assignedDrivers mismatch"
    
    # Shipment
    assert dash["activeDeliveries"] == fleet["active_shipments"], "activeDeliveries mismatch"
    assert dash["totalShipments"] == ops["total_deliveries"], "totalShipments mismatch"
    
    print("Dashboard Consistency PASSED!")

if __name__ == "__main__":
    main()
