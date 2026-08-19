import requests

OSRM_URL = "https://router.project-osrm.org/route/v1/driving"


def generate_route(start_lat, start_lon, end_lat, end_lon):

    url = (
        f"{OSRM_URL}/"
        f"{start_lon},{start_lat};"
        f"{end_lon},{end_lat}"
    )

    response = requests.get(
        url,
        params={
            "overview": "full",
            "geometries": "geojson"
        }
    )

    response.raise_for_status()

    data = response.json()

    if not data.get("routes"):
        raise Exception("No route found")

    route = data["routes"][0]

    return {
        "distance": round(route["distance"] / 1000, 2),
        "duration_seconds": route["duration"],
        "estimated_travel_time": round(route["duration"] / 60, 2),
        "route_summary": route["geometry"]["coordinates"]
    }