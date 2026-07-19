import requests

# Nominatim (OpenStreetMap's free geocoding service) requires a descriptive
# User-Agent and asks that you don't send more than ~1 request/second.
HEADERS = {"User-Agent": "FleetFlow/1.0 (fleet management app)"}


def geocode_location(location_name: str):
    """
    Accepts a location name (e.g. "Delhi") and returns its latitude and longitude
    using OpenStreetMap's Nominatim API (free, no API key or billing needed).
    Returns None if the location can't be found.
    """
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location_name,
        "format": "json",
        "limit": 1,
    }

    response = requests.get(url, params=params, headers=HEADERS, timeout=10)
    data = response.json()

    if not data:
        return None

    return {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"])}