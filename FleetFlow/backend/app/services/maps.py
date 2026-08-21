import requests
from datetime import datetime, timedelta

from app.config import ORS_API_KEY


def geocode_address(address: str):
    url = "https://api.openrouteservice.org/geocode/search"

    headers = {
        "Authorization": ORS_API_KEY
    }

    params = {
        "text": address,
        "size": 1
    }

    response = requests.get(
        url,
        headers=headers,
        params=params
    )

    if response.status_code != 200:
        raise Exception(
            f"Geocoding failed: {response.text}"
        )

    data = response.json()

    if not data["features"]:
        raise Exception("Address not found")

    coordinates = data["features"][0]["geometry"]["coordinates"]

    return coordinates


def get_route(origin: str, destination: str):
    origin_coords = geocode_address(origin)
    destination_coords = geocode_address(destination)

    # GeoJSON endpoint returns route geometry
    # as actual coordinate arrays.
    url = (
        "https://api.openrouteservice.org/"
        "v2/directions/driving-car/geojson"
    )

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/geo+json"
    }

    body = {
        "coordinates": [
            origin_coords,
            destination_coords
        ],
        "instructions": False
    }

    response = requests.post(
        url,
        headers=headers,
        json=body
    )

    if response.status_code != 200:
        raise Exception(
            f"Route calculation failed: {response.text}"
        )

    data = response.json()

    if not data.get("features"):
        raise Exception(
            "No route was returned by OpenRouteService"
        )

    feature = data["features"][0]

    summary = feature["properties"]["summary"]

    distance_km = round(
        summary["distance"] / 1000,
        2
    )

    duration_minutes = round(
        summary["duration"] / 60,
        2
    )

    eta = (
        datetime.now()
        + timedelta(minutes=duration_minutes)
    ).isoformat()

    # GeoJSON coordinates are [longitude, latitude]
    route_coordinates = feature["geometry"]["coordinates"]

    # Leaflet expects [latitude, longitude]
    route_coordinates = [
        [coordinate[1], coordinate[0]]
        for coordinate in route_coordinates
    ]

    return {
        "distance_km": distance_km,
        "duration_minutes": duration_minutes,
        "eta": eta,
        "route_coordinates": route_coordinates
    }