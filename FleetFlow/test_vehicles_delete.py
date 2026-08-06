import requests

res = requests.post("http://127.0.0.1:8000/auth/login", json={"email": "admin@fleetflow.in", "password": "FleetFlow@123"})
token = res.json()["tokens"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

res = requests.delete("http://127.0.0.1:8000/vehicles/119", headers=headers)
print("Delete:", res.status_code, res.text)

res2 = requests.delete("http://127.0.0.1:8000/drivers/119", headers=headers)
print("Delete Driver:", res2.status_code, res2.text)
