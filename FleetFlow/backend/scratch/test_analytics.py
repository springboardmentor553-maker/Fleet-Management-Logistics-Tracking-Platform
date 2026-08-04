import requests

BASE_URL = "http://localhost:8000"

# Login
res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "testadmin@fleetflow.in",
    "password": "password"
})
res.raise_for_status()
token = res.json()["tokens"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

def test_endpoint(name, url):
    print(f"\n--- Testing {name} ---")
    r = requests.get(url, headers=headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print("Success!")
        print(r.json())
    else:
        print(r.text)

test_endpoint("Fleet Dashboard", f"{BASE_URL}/dashboard/fleet")
test_endpoint("Fuel Analytics", f"{BASE_URL}/analytics/fuel")
test_endpoint("Operations Analytics", f"{BASE_URL}/analytics/operations")
test_endpoint("Maintenance Report", f"{BASE_URL}/reports/maintenance")
# Just pick driver_id 1
test_endpoint("Driver Performance", f"{BASE_URL}/drivers/1/performance")

