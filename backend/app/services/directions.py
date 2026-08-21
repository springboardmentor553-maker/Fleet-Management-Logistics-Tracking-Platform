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
):
    """
    Get Google Maps driving route.

    The request uses:
    - current departure time
    - best_guess traffic model

    When Google provides traffic data,
    duration_in_traffic is used.

    If traffic data is unavailable,
    normal route duration is used.
    """

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

        "departure_time":
            int(time.time()),

        "traffic_model":
            "best_guess",

        "key":
            GOOGLE_MAPS_API_KEY,
    }


    response = requests.get(
        url,
        params=params,
        timeout=20
    )


    response.raise_for_status()


    data = response.json()


    if data.get("status") != "OK":

        raise Exception(
            "Directions API Error: "
            f"{data.get('status', 'UNKNOWN')}"
        )


    route = (
        data["routes"][0]
    )

    leg = (
        route["legs"][0]
    )


    # Google returns duration_in_traffic
    # when traffic information is available.

    traffic_duration = (
        leg.get(
            "duration_in_traffic"
        )
        or
        leg["duration"]
    )


    return {

        "distance_text":
            leg["distance"]["text"],

        "distance_meters":
            leg["distance"]["value"],


        # Traffic-aware duration
        "duration_text":
            traffic_duration["text"],

        "duration_seconds":
            traffic_duration["value"],


        # Normal duration retained
        # for comparison/debugging.

        "normal_duration_text":
            leg["duration"]["text"],

        "normal_duration_seconds":
            leg["duration"]["value"],


        "traffic_aware":
            "duration_in_traffic"
            in leg,


        "summary":
            route.get(
                "summary",
                "No route summary available"
            ),


        "polyline":
            route[
                "overview_polyline"
            ]["points"],
    }