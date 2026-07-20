"""Geocoding Service – powered by Nominatim (OpenStreetMap).

Converts a human-readable location string into latitude/longitude.
No API key or billing required.

Usage policy: https://operations.osmfoundation.org/policies/nominatim/
  - Max 1 request/second (we respect this via the timeout)
  - Must send a descriptive User-Agent header (set below)
"""

import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Nominatim requires a meaningful User-Agent per their usage policy
_HEADERS = {
    "User-Agent": "FleetFlow/1.0 (fleet-management-logistics-app)"
}


class GeocodingError(Exception):
    """Raised when geocoding fails or returns no results."""


def geocode_location(location: str) -> tuple[float, float]:
    """Return (latitude, longitude) for the given location string.

    Uses Nominatim (OpenStreetMap) — free, no API key needed.

    Args:
        location: Human-readable address or place name,
                  e.g. "Mumbai, Maharashtra, India"

    Returns:
        A (lat, lng) tuple of floats.

    Raises:
        GeocodingError: If no results are returned.
        httpx.HTTPError: On network-level failures.
    """
    params = {
        "q": location,
        "format": "json",
        "limit": 1,
    }

    response = httpx.get(
        NOMINATIM_URL,
        params=params,
        headers=_HEADERS,
        timeout=30.0,
    )
    response.raise_for_status()

    results = response.json()

    if not results:
        raise GeocodingError(
            f"No geocoding results found for '{location}'. "
            "Try a more specific location name, e.g. 'Mumbai, Maharashtra, India'."
        )

    best = results[0]
    return float(best["lat"]), float(best["lon"])
