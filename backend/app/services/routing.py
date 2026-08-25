import requests


def get_route(pickup_lat: float, pickup_lng: float, destination_lat: float, destination_lng: float):
    """
    Uses OSRM's public routing API (free, no API key or billing needed) to
    calculate a driving route between two coordinates.
    Returns total distance (km), estimated duration (minutes), and the
    route's coordinate list (as [lat, lng] pairs, matching what the
    frontend's OSRM helper already returns).
    """
    url = (
        f"https://router.project-osrm.org/route/v1/driving/"
        f"{pickup_lng},{pickup_lat};{destination_lng},{destination_lat}"
    )
    params = {
        "overview": "full",
        "geometries": "geojson",
    }

    response = requests.get(url, params=params, timeout=10)
    data = response.json()

    if data.get("code") != "Ok" or not data.get("routes"):
        return None

    route = data["routes"][0]

    # OSRM returns [lng, lat] pairs — flip to [lat, lng] to match the frontend
    coordinates = [[lat, lng] for lng, lat in route["geometry"]["coordinates"]]

    return {
        "distance_km": route["distance"] / 1000,
        "duration_min": route["duration"] / 60,
        "route_summary": "",
        "polyline": coordinates,
    }