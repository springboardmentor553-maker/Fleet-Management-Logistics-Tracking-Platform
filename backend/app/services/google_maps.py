import os
import requests
import googlemaps

from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

gmaps = googlemaps.Client(key=API_KEY)


def get_coordinates(address: str):
    """
    Returns latitude and longitude for an address.
    """

    result = gmaps.geocode(address)

    if not result:
        raise Exception(f"Could not find coordinates for: {address}")

    location = result[0]["geometry"]["location"]

    return (
        location["lat"],
        location["lng"]
    )

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
        "key": os.getenv("GOOGLE_MAPS_API_KEY"),
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data["status"] != "OK":
        raise Exception(f"Directions API Error: {data['status']}")

    route = data["routes"][0]
    leg = route["legs"][0]

    return {
    "pickup_location": leg["start_address"],
    "destination": leg["end_address"],

    "distance": leg["distance"]["text"],
    "distance_meters": leg["distance"]["value"],

    "duration": leg["duration"]["text"],
    "duration_seconds": leg["duration"]["value"],

    "summary": route["summary"],

    "polyline": route["overview_polyline"]["points"],
    }