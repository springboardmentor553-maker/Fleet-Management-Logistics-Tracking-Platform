import requests

res = requests.post("http://127.0.0.1:8000/auth/login", json={"email": "admin@fleetflow.in", "password": "FleetFlow@123"})
token = res.json()["tokens"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

res = requests.delete("http://127.0.0.1:8000/vehicles/1", headers=headers)
print("Delete Vehicle 1:", res.status_code, res.text)
