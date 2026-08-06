import requests

res = requests.post("http://127.0.0.1:8000/auth/login", json={"email": "admin@fleetflow.in", "password": "admin"})
token = res.json()["tokens"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

payload = {
    "registration_number": "TEST-1234",
    "vehicle_type": "Truck",
    "capacity": 5.0,
    "fuel_type": "Diesel",
    "current_status": "AVAILABLE"
}

res = requests.post("http://127.0.0.1:8000/vehicles", json=payload, headers=headers)
print("Create Vehicle (no slash):", res.status_code, res.text)
res = requests.post("http://127.0.0.1:8000/vehicles/", json=payload, headers=headers)
print("Create Vehicle (slash):", res.status_code, res.text)
