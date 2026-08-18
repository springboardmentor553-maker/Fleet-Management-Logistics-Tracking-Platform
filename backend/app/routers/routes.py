from fastapi import APIRouter, Query, HTTPException
import requests

router = APIRouter()


# =========================================================
# GEOCODING
# =========================================================

def geocode_place(location: str):
    """
    Convert a place/city name into latitude and longitude
    using OpenStreetMap Nominatim.
    """

    location = location.strip()

    if not location:
        raise HTTPException(
            status_code=400,
            detail="Location is required",
        )

    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": location,
        "format": "json",
        "limit": 1,
    }

    headers = {
        "User-Agent": "FleetFlow/1.0",
    }

    try:
        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=10,
        )

        response.raise_for_status()

        results = response.json()

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Geocoding service unavailable: {error}",
        )

    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"Location not found: {location}",
        )

    result = results[0]

    return {
        "location": location,
        "latitude": float(result["lat"]),
        "longitude": float(result["lon"]),
        "display_name": result.get(
            "display_name",
            location,
        ),
    }


# =========================================================
# STANDARD GEOCODE ENDPOINT
# =========================================================

@router.get("/geocode")
def geocode_location(
    location: str = Query(
        ...,
        min_length=2,
        description="Place name to geocode",
    )
):
    return geocode_place(location)


# =========================================================
# ROUTE PLANNER COMPATIBILITY ENDPOINT
# =========================================================

@router.get("/route_location")
def route_location(
    location: str = Query(
        ...,
        min_length=2,
        description="Pickup or destination location",
    )
):
    """
    Compatibility endpoint for the Route Planner frontend.

    Example:
    /routes/route_location?location=Hyderabad
    """

    return geocode_place(location)