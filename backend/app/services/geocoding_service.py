import requests


def get_coordinates(location: str):
    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": location,
        "format": "json",
        "limit": 1
    }

    headers = {
        "User-Agent": "FleetManagementApp/1.0"
    }

    response = requests.get(url, params=params, headers=headers)

    if response.status_code != 200:
        return None

    data = response.json()

    if not data:
        return None

    return {
        "latitude": float(data[0]["lat"]),
        "longitude": float(data[0]["lon"])
    }