import requests


# ==========================================================
# OSRM
# ==========================================================

OSRM_URL = (
    "https://router.project-osrm.org/route/v1/driving"
)


USER_AGENT = (
    "FleetFlow/1.0 "
    "(contact: fleetflow.student.project@example.com)"
)


# ==========================================================
# GENERATE ROAD ROUTE
# ==========================================================

def get_route(

    pickup_latitude: float,

    pickup_longitude: float,

    destination_latitude: float,

    destination_longitude: float,

):

    # ------------------------------------------------------
    # Validate coordinates
    # ------------------------------------------------------

    values = [

        pickup_latitude,

        pickup_longitude,

        destination_latitude,

        destination_longitude,

    ]


    if any(
        value is None
        for value in values
    ):

        raise ValueError(
            "All route coordinates are required."
        )


    # ------------------------------------------------------
    # OSRM requires:
    #
    # longitude,latitude
    # ------------------------------------------------------

    coordinates = (

        f"{pickup_longitude},"
        f"{pickup_latitude};"

        f"{destination_longitude},"
        f"{destination_latitude}"

    )


    url = (
        f"{OSRM_URL}/{coordinates}"
    )


    # ------------------------------------------------------
    # Parameters
    # ------------------------------------------------------

    params = {

        "overview": "full",

        "geometries": "geojson",

        "steps": "true",

        "alternatives": "false",

    }


    headers = {

        "User-Agent":
            USER_AGENT,

        "Accept":
            "application/json",

    }


    # ------------------------------------------------------
    # Request OSRM
    # ------------------------------------------------------

    try:

        response = requests.get(

            url,

            params=params,

            headers=headers,

            timeout=30,

        )

        response.raise_for_status()

        data = response.json()


    except requests.RequestException as e:

        raise ValueError(

            "OSRM routing failed: "

            f"{str(e)}"

        )


    # ------------------------------------------------------
    # Check response
    # ------------------------------------------------------

    if data.get("code") != "Ok":

        raise ValueError(

            data.get(

                "message",

                "Unable to calculate route."

            )

        )


    routes = data.get(
        "routes",
        []
    )


    if not routes:

        raise ValueError(
            "No road route found."
        )


    route = routes[0]


    # ------------------------------------------------------
    # Distance
    # ------------------------------------------------------

    distance_meters = route.get(
        "distance",
        0
    )


    distance_km = (
        distance_meters / 1000
    )


    # ------------------------------------------------------
    # Duration
    # ------------------------------------------------------

    duration_seconds = route.get(
        "duration",
        0
    )


    duration_minutes = (
        duration_seconds / 60
    )


    # ------------------------------------------------------
    # Geometry
    # ------------------------------------------------------

    geometry = route.get(

        "geometry",

        {

            "type":
                "LineString",

            "coordinates":
                [],

        },

    )


    return {

        "distance_km":
            round(
                distance_km,
                2
            ),

        "duration_minutes":
            round(
                duration_minutes,
                2
            ),

        "geometry":
            geometry,

    }