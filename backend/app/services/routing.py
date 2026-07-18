import requests
from app.config import settings


def get_route(pickup_lat: float, pickup_lng: float, destination_lat: float, destination_lng: float):
    """
    Uses the Google Directions API to calculate a driving route between two coordinates.
    Returns total distance (km), estimated duration (minutes), and a route summary/polyline.
    """
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": f"{pickup_lat},{pickup_lng}",
        "destination": f"{destination_lat},{destination_lng}",
        "key": settings.GOOGLE_MAPS_API_KEY,
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data.get("status") != "OK" or not data.get("routes"):
        return None

    route = data["routes"][0]
    leg = route["legs"][0]

    return {
        "distance_km": leg["distance"]["value"] / 1000,
        "duration_min": leg["duration"]["value"] / 60,
        "route_summary": route.get("summary", ""),
        "polyline": route.get("overview_polyline", {}).get("points", ""),
    }