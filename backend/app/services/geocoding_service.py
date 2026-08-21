
import requests


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


# ============================================================
# GEOCODE LOCATION
# ============================================================

def geocode_location(location: str):
    """
    Convert a location name into latitude and longitude
    using OpenStreetMap Nominatim.
    """

    if not location:
        return None

    try:

        response = requests.get(
            NOMINATIM_URL,

            params={
                "q": location,
                "format": "json",
                "limit": 1
            },

            headers={
                "User-Agent": "FleetFlow/1.0"
            },

            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        if not data:
            return None

        return {
            "latitude": float(data[0]["lat"]),
            "longitude": float(data[0]["lon"])
        }

    except requests.RequestException as e:

        print(
            "Geocoding error:",
            e
        )

        return None


# ============================================================
# BACKWARD COMPATIBILITY
# ============================================================

def get_coordinates(location: str):
    """
    Backward-compatible wrapper.

    Existing routers that use get_coordinates()
    can continue working.
    """

    return geocode_location(location)
