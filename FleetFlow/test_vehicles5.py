import requests

res = requests.post("http://127.0.0.1:8000/auth/login", json={"email": "admin@fleetflow.in", "password": "FleetFlow@123"})
print("Login Status:", res.status_code)
if res.status_code == 200:
    token = res.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "registration_number": "TEST-1234",
        "vehicle_type": "Truck",
        "capacity": 5.0,
        "fuel_type": "Diesel",
        "current_status": "AVAILABLE"
    }
    
    res2 = requests.post("http://127.0.0.1:8000/vehicles", json=payload, headers=headers)
    print("Create Vehicle (no slash):", res2.status_code, res2.text)
    
    res3 = requests.post("http://127.0.0.1:8000/vehicles/", json=payload, headers=headers)
    print("Create Vehicle (slash):", res3.status_code, res3.text)
