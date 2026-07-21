"""
Geocoding service — Nominatim (OpenStreetMap).

Converts a human-readable location name into latitude/longitude coordinates.
Uses httpx for HTTP requests (already in requirements.txt).
"""
import logging

import httpx
from fastapi import HTTPException

from app.config import NOMINATIM_USER_AGENT

logger = logging.getLogger("fleetflow.geocoding_service")

# Nominatim public endpoint — free, no API key required.
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Timeout for geocoding requests (seconds).
GEOCODE_TIMEOUT = 10.0


def geocode_location(location_name: str) -> dict:
    """
    Convert a location name into latitude and longitude using Nominatim.

    Parameters
    ----------
    location_name : str
        Human-readable address or place name (e.g. "Chennai, India").

    Returns
    -------
    dict
        {"latitude": float, "longitude": float}

    Raises
    ------
    HTTPException 400
        When Nominatim returns no results for the given location.
    HTTPException 502
        When the Nominatim service is unreachable or returns an unexpected error.
    """
    if not location_name or not location_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Location name must not be empty."
        )

    params = {
        "q": location_name.strip(),
        "format": "json",
        "limit": 1,
    }
    headers = {
        # Nominatim usage policy requires a descriptive User-Agent.
        "User-Agent": NOMINATIM_USER_AGENT,
        "Accept-Language": "en",
    }

    logger.info("geocode_location — querying Nominatim for: %r", location_name)

    try:
        response = httpx.get(
            NOMINATIM_URL,
            params=params,
            headers=headers,
            timeout=GEOCODE_TIMEOUT,
        )
        response.raise_for_status()
    except httpx.TimeoutException:
        logger.error(
            "geocode_location — Nominatim request timed out for: %r", location_name
        )
        raise HTTPException(
            status_code=502,
            detail=f"Geocoding service timed out while resolving '{location_name}'. "
                   "Please try again later.",
        )
    except httpx.HTTPStatusError as exc:
        logger.error(
            "geocode_location — Nominatim HTTP %s for: %r",
            exc.response.status_code, location_name
        )
        raise HTTPException(
            status_code=502,
            detail=f"Geocoding service returned HTTP {exc.response.status_code}.",
        )
    except httpx.RequestError as exc:
        logger.error(
            "geocode_location — network error for %r: %s", location_name, exc
        )
        raise HTTPException(
            status_code=502,
            detail="Geocoding service is currently unavailable. Please try again later.",
        )

    results = response.json()

    if not results:
        logger.warning(
            "geocode_location — no results found for: %r", location_name
        )
        raise HTTPException(
            status_code=400,
            detail=f"Could not geocode location: '{location_name}'. "
                   "Please provide a more specific address.",
        )

    best = results[0]
    latitude = float(best["lat"])
    longitude = float(best["lon"])

    logger.info(
        "geocode_location — resolved %r → lat=%.6f, lon=%.6f",
        location_name, latitude, longitude,
    )

    return {"latitude": latitude, "longitude": longitude}
