import requests

def get_route(pickup_lat, pickup_lon, destination_lat, destination_lon):

    url = (
        f"https://router.project-osrm.org/route/v1/driving/"
        f"{pickup_lon},{pickup_lat};{destination_lon},{destination_lat}"
        "?overview=full&geometries=polyline"
    )

    response = requests.get(url)

    if response.status_code != 200:
        return None

    data = response.json()

    if not data.get("routes"):
        return None

    route = data["routes"][0]

    return {
        "distance_km": round(route["distance"] / 1000, 2),
        "estimated_duration_minutes": round(route["duration"] / 60, 2),
        "route_polyline": route["geometry"]
    }