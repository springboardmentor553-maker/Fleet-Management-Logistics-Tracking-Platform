import httpx
from fastapi import HTTPException, status

# OpenStreetMap's free Nominatim geocoding service. No API key required.
# Usage policy: https://operations.osmfoundation.org/policies/nominatim/
# Keep request volume light (this is a shared public service) and always
# send a descriptive User-Agent, which Nominatim requires.
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "FleetFlow-Student-Project/1.0"


class GeocodeResult:
    def __init__(self, latitude: float, longitude: float, formatted_address: str):
        self.latitude = latitude
        self.longitude = longitude
        self.formatted_address = formatted_address


def geocode_location(location_name: str) -> GeocodeResult:
    """Task 3: accepts a location name and retrieves its latitude/longitude
    using OpenStreetMap's free Nominatim geocoding service."""
    response = httpx.get(
        NOMINATIM_URL,
        params={"q": location_name, "format": "json", "limit": 1},
        headers={"User-Agent": USER_AGENT},
        timeout=10.0,
    )
    response.raise_for_status()
    results = response.json()

    if not results:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not geocode location '{location_name}': no results found",
        )

    result = results[0]
    return GeocodeResult(
        latitude=float(result["lat"]),
        longitude=float(result["lon"]),
        formatted_address=result.get("display_name", location_name),
    )
