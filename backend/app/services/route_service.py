import requests


def get_route(
    pickup_lat,
    pickup_lng,
    destination_lat,
    destination_lng
):

    url = (
        f"https://router.project-osrm.org/route/v1/driving/"
        f"{pickup_lng},{pickup_lat};"
        f"{destination_lng},{destination_lat}"
    )

    params = {
        "overview": "full",
        "geometries": "geojson"
    }

    response = requests.get(
        url,
        params=params,
        timeout=20
    )

    response.raise_for_status()

    data = response.json()

    if data["code"] != "Ok":

        raise Exception("Unable to calculate route.")

    route = data["routes"][0]

    return {

        "distance_km": round(
            route["distance"] / 1000,
            2
        ),

        "duration_minutes": round(
            route["duration"] / 60,
            2
        ),

        "geometry": route["geometry"]

    }