import os
import requests

from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


def get_route(
    pickup_latitude: float,
    pickup_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
):
    """
    Returns:
        - Total Distance
        - Estimated Duration
        - Route Polyline
    """

    url = "https://maps.googleapis.com/maps/api/directions/json"

    params = {
        "origin": f"{pickup_latitude},{pickup_longitude}",
        "destination": f"{destination_latitude},{destination_longitude}",
        "key": GOOGLE_MAPS_API_KEY,
    }

    response = requests.get(url, params=params)

    data = response.json()

    if data["status"] != "OK":
        raise Exception(
            f"Directions API Error: {data['status']}"
        )

    route = data["routes"][0]

    leg = route["legs"][0]

    return {
    "distance_text": leg["distance"]["text"],
    "distance_meters": leg["distance"]["value"],
    "duration_text": leg["duration"]["text"],
    "duration_seconds": leg["duration"]["value"],
    "summary": route.get("summary", "No route summary available"),
    "polyline": route["overview_polyline"]["points"],
    }