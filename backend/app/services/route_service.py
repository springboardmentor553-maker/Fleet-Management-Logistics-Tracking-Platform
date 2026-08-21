import requests


OSRM_URL = (
    "https://router.project-osrm.org/"
    "route/v1/driving"
)


def get_route(
    pickup_lat: float,
    pickup_lon: float,
    destination_lat: float,
    destination_lon: float
):

    try:

        pickup_lat = float(
            pickup_lat
        )

        pickup_lon = float(
            pickup_lon
        )

        destination_lat = float(
            destination_lat
        )

        destination_lon = float(
            destination_lon
        )

    except (
        TypeError,
        ValueError
    ):

        print(
            "Invalid coordinates"
        )

        return None

    # =====================================================
    # VALIDATE COORDINATES
    # =====================================================

    if not -90 <= pickup_lat <= 90:

        return None

    if not -180 <= pickup_lon <= 180:

        return None

    if not -90 <= destination_lat <= 90:

        return None

    if not -180 <= destination_lon <= 180:

        return None

    # =====================================================
    # OSRM FORMAT
    #
    # longitude,latitude
    # =====================================================

    coordinates = (

        f"{pickup_lon},{pickup_lat};"

        f"{destination_lon},{destination_lat}"

    )

    url = (
        f"{OSRM_URL}/{coordinates}"
    )

    params = {

        "overview":
            "full",

        "geometries":
            "polyline",

        "steps":
            "false",

        "alternatives":
            "false"
    }

    print(
        "========================================"
    )

    print(
        "OSRM REQUEST"
    )

    print(
        "URL:",
        url
    )

    print(
        "========================================"
    )

    try:

        response = requests.get(

            url,

            params=params,

            timeout=20

        )

        response.raise_for_status()

        data = response.json()

        print(
            "OSRM CODE:",
            data.get("code")
        )

        if data.get("code") != "Ok":

            print(
                "OSRM ERROR:",
                data
            )

            return None

        routes = data.get(
            "routes",
            []
        )

        if not routes:

            print(
                "No OSRM routes"
            )

            return None

        route = routes[0]

        # =================================================
        # DISTANCE
        # =================================================

        distance_meters = float(
            route.get(
                "distance",
                0
            )
        )

        distance_km = round(
            distance_meters / 1000,
            2
        )

        # =================================================
        # DURATION
        # =================================================

        duration_seconds = float(
            route.get(
                "duration",
                0
            )
        )

        duration_minutes = round(
            duration_seconds / 60
        )

        # =================================================
        # POLYLINE
        # =================================================

        encoded_polyline = (
            route.get("geometry")
        )

        if not encoded_polyline:

            print(
                "OSRM returned no geometry"
            )

            return None

        result = {

            "distance_km":
                distance_km,

            "duration_minutes":
                duration_minutes,

            "polyline":
                encoded_polyline
        }

        print(
            "ROUTE RESULT:",
            result
        )

        return result

    except requests.RequestException as e:

        print(
            "OSRM REQUEST ERROR:",
            e
        )

        return None

    except Exception as e:

        print(
            "OSRM ERROR:",
            e
        )

        return None