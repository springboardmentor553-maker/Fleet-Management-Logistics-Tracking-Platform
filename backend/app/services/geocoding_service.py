import requests

url = "https://nominatim.openstreetmap.org/search"

headers = {
    "User-Agent": "FleetFlow/1.0 (student-project@example.com)",
    "Accept": "application/json",
}

params = {
    "q": "Pune",
    "format": "jsonv2",
    "limit": 1,
}

response = requests.get(
    url,
    headers=headers,
    params=params,
    timeout=20
)

print("Status:", response.status_code)
print("Headers:", response.headers)
print("Body:", response.text)