import requests
import json

res = requests.post("http://127.0.0.1:8000/auth/login", json={"email": "admin@fleetflow.in", "password": "admin"})
print("Status:", res.status_code)
print("Response:", res.text)
