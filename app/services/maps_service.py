import requests
from fastapi import HTTPException

from app.config import ORS_API_KEY


GEOCODE_URL = "https://api.openrouteservice.org/geocode/search"
DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-car"


# =====================================
# Geocode a location name into lat/lng
# =====================================

def geocode_location(location_name: str):

    params = {
        "api_key": ORS_API_KEY,
        "text": location_name,
        "size": 1,
    }

    response = requests.get(GEOCODE_URL, params=params)
    data = response.json()

    features = data.get("features", [])

    if not features:
        raise HTTPException(
            status_code=400,
            detail=f"Could not geocode location: {location_name}"
        )

    coordinates = features[0]["geometry"]["coordinates"]

    return {
        "latitude": coordinates[1],
        "longitude": coordinates[0],
    }


# =====================================
# Generate a route between two coordinate pairs
# =====================================

def get_route(
    pickup_lat: float,
    pickup_lng: float,
    destination_lat: float,
    destination_lng: float,
):

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json",
    }

    body = {
        "coordinates": [
            [pickup_lng, pickup_lat],
            [destination_lng, destination_lat],
        ]
    }

    response = requests.post(DIRECTIONS_URL, json=body, headers=headers)
    data = response.json()

    routes = data.get("routes")

    if not routes:
        raise HTTPException(
            status_code=400,
            detail="Could not generate route between the given locations"
        )

    route = routes[0]
    summary = route["summary"]

    return {
        "distance_km": round(summary["distance"] / 1000, 2),
        "duration_minutes": round(summary["duration"] / 60, 2),
        "polyline": route["geometry"],
    }