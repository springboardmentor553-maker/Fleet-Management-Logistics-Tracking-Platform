import os
import time
import requests

from dotenv import load_dotenv


load_dotenv()


GOOGLE_MAPS_API_KEY = os.getenv(
    "GOOGLE_MAPS_API_KEY"
)


def get_route(
    pickup_latitude: float,
    pickup_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
    route_type: str = "fastest",
):
    """
    Get an optimized Google Maps driving route.

    Supported route types:
    - fastest
    - shortest
    - traffic_avoidance
    - fuel_efficient

    The existing traffic-aware workflow is preserved.
    """

    route_type = (
        route_type or "fastest"
    ).lower().strip()

    allowed_route_types = {
        "fastest",
        "shortest",
        "traffic_avoidance",
        "fuel_efficient",
    }

    if route_type not in allowed_route_types:
        route_type = "fastest"

    url = (
        "https://maps.googleapis.com/maps/api/"
        "directions/json"
    )

    params = {
        "origin": (
            f"{pickup_latitude},"
            f"{pickup_longitude}"
        ),
        "destination": (
            f"{destination_latitude},"
            f"{destination_longitude}"
        ),
        "mode": "driving",
        "departure_time": int(time.time()),
        "traffic_model": "best_guess",
        "alternatives": "true",
        "key": GOOGLE_MAPS_API_KEY,
    }

    # Traffic avoidance uses Google's supported
    # route avoidance options.
    if route_type == "traffic_avoidance":
        params["avoid"] = "tolls|highways"

    response = requests.get(
        url,
        params=params,
        timeout=20,
    )

    response.raise_for_status()

    data = response.json()

    if data.get("status") != "OK":
        raise Exception(
            "Directions API Error: "
            f"{data.get('status', 'UNKNOWN')}"
        )

    routes = data.get("routes", [])

    if not routes:
        raise Exception(
            "Directions API returned no routes."
        )

    def route_values(route):
        leg = route["legs"][0]

        traffic_duration = (
            leg.get("duration_in_traffic")
            or leg["duration"]
        )

        return {
            "route": route,
            "leg": leg,
            "distance": leg["distance"]["value"],
            "normal_duration": leg["duration"]["value"],
            "traffic_duration": traffic_duration["value"],
        }

    candidates = [
        route_values(route)
        for route in routes
    ]

    # ------------------------------------------
    # ROUTE SELECTION
    # ------------------------------------------

    if route_type == "shortest":
        selected = min(
            candidates,
            key=lambda item: item["distance"],
        )

    elif route_type == "traffic_avoidance":
        selected = min(
            candidates,
            key=lambda item: item["traffic_duration"],
        )

    elif route_type == "fuel_efficient":
        # Fuel efficiency is approximated using
        # distance + travel time. This keeps the
        # implementation within the existing
        # Google Maps architecture without adding
        # another routing provider.
        selected = min(
            candidates,
            key=lambda item: (
                item["distance"]
                + (
                    item["traffic_duration"]
                    * 10
                )
            ),
        )

    else:
        # Fastest route = lowest
        # traffic-aware travel time.
        selected = min(
            candidates,
            key=lambda item: item["traffic_duration"],
        )

    route = selected["route"]
    leg = selected["leg"]

    traffic_duration = (
        leg.get("duration_in_traffic")
        or leg["duration"]
    )

    return {
        "distance_text":
            leg["distance"]["text"],

        "distance_meters":
            leg["distance"]["value"],

        "duration_text":
            traffic_duration["text"],

        "duration_seconds":
            traffic_duration["value"],

        "normal_duration_text":
            leg["duration"]["text"],

        "normal_duration_seconds":
            leg["duration"]["value"],

        "traffic_aware":
            "duration_in_traffic" in leg,

        "route_type":
            route_type,

        "summary":
            route.get(
                "summary",
                "No route summary available",
            ),

        "polyline":
            route[
                "overview_polyline"
            ]["points"],
    }