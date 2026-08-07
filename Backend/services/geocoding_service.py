import requests

NOMINATIM_URL = (
    "https://nominatim.openstreetmap.org/search"
)



def get_coordinates(location: str):

    params = {

        "q": location,

        "format": "json",

        "limit": 1

    }


    headers = {

        "User-Agent": "FleetFlow/1.0"

    }


    response = requests.get(
        NOMINATIM_URL,
        params=params,
        headers=headers
    )


    data = response.json()


    if not data:

        raise Exception(
            "Location not found"
        )


    return {

        "latitude": float(
            data[0]["lat"]
        ),

        "longitude": float(
            data[0]["lon"]
        )

    }