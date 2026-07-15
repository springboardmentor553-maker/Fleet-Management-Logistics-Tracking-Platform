"""Google Maps Geocoding Service.

Converts a human-readable location string (e.g. "Mumbai, MH") into
geographic coordinates (latitude, longitude) using the Google Geocoding API.

API docs: https://developers.google.com/maps/documentation/geocoding
"""

import httpx

from app.config import settings


GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"


class GeocodingError(Exception):
    """Raised when geocoding fails or returns no results."""


def geocode_location(location: str) -> tuple[float, float]:
    """Return (latitude, longitude) for the given location string.

    Args:
        location: Human-readable address or place name.

    Returns:
        A (lat, lng) tuple of floats.

    Raises:
        GeocodingError: If the API returns no results or an error status.
        httpx.HTTPError: On network-level failures.
    """
    if not settings.google_maps_api_key:
        raise GeocodingError(
            "GOOGLE_MAPS_API_KEY is not configured. "
            "Set it in your .env file before using geocoding."
        )

    params = {
        "address": location,
        "key": settings.google_maps_api_key,
    }

    response = httpx.get(GEOCODING_URL, params=params, timeout=10.0)
    response.raise_for_status()

    data = response.json()

    if data.get("status") != "OK":
        raise GeocodingError(
            f"Geocoding failed for '{location}': "
            f"status={data.get('status')}, "
            f"error_message={data.get('error_message', 'none')}"
        )

    results = data.get("results", [])
    if not results:
        raise GeocodingError(f"No geocoding results found for '{location}'")

    location_data = results[0]["geometry"]["location"]
    return location_data["lat"], location_data["lng"]
