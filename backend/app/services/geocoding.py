import requests
from app.config import settings


def geocode_location(location_name: str):
    """
    Accepts a location name (e.g. "Delhi") and returns its latitude and longitude
    using the Google Geocoding API. Returns None if the location can't be found.
    """
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": location_name,
        "key": settings.GOOGLE_MAPS_API_KEY,
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data.get("status") != "OK" or not data.get("results"):
        return None

    location = data["results"][0]["geometry"]["location"]
    return {"lat": location["lat"], "lng": location["lng"]}