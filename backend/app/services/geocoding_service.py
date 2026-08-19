import requests

def get_coordinates(location: str):
    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": location,
        "format": "json",
        "limit": 1
    }

    headers = {
        "User-Agent": "Fleet-Management-System"
    }

    response = requests.get(url, params=params, headers=headers)

    if response.status_code == 200:
        data = response.json()

        if data:
            return {
                "latitude": float(data[0]["lat"]),
                "longitude": float(data[0]["lon"])
            }

    return None