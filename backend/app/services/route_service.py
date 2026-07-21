"""
Route service — OpenRouteService (ORS).

Calls the ORS Directions API to compute driving-car routes between two
lat/lon pairs and returns distance, duration, a human-readable summary,
and a polyline string.
"""
import logging
from typing import Optional

import httpx
from fastapi import HTTPException

from app.config import ORS_API_KEY

logger = logging.getLogger("fleetflow.route_service")

# ORS driving-car directions endpoint (JSON output).
ORS_DIRECTIONS_URL = (
    "https://api.openrouteservice.org/v2/directions/driving-car/json"
)

# Timeout for routing requests (seconds).
ROUTE_TIMEOUT = 15.0


def generate_route(
    pickup_latitude: float,
    pickup_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
) -> dict:
    """
    Generate a driving route between two coordinate pairs using OpenRouteService.

    Parameters
    ----------
    pickup_latitude, pickup_longitude : float
        Origin coordinates.
    destination_latitude, destination_longitude : float
        Destination coordinates.

    Returns
    -------
    dict
        {
            "distance_km": float,
            "estimated_duration_minutes": float,
            "route_summary": str,
            "polyline": str | None,
        }

    Raises
    ------
    HTTPException 503
        When ORS_API_KEY is not configured.
    HTTPException 422
        When ORS returns a response but contains no route segments.
    HTTPException 502
        When the ORS API is unreachable or returns an unexpected HTTP error.
    """
    if not ORS_API_KEY or ORS_API_KEY == "your_openrouteservice_api_key_here":
        logger.error("generate_route — ORS_API_KEY is not configured in .env")
        raise HTTPException(
            status_code=503,
            detail="Route service is not configured. "
                   "Set ORS_API_KEY in the backend .env file.",
        )

    # ORS coordinates format: [[longitude, latitude], ...]
    payload = {
        "coordinates": [
            [pickup_longitude, pickup_latitude],
            [destination_longitude, destination_latitude],
        ],
        "instructions": False,  # skip turn-by-turn to keep response lean
        "geometry": True,       # include encoded polyline
    }
    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    logger.info(
        "generate_route — calling ORS from (%.6f, %.6f) to (%.6f, %.6f)",
        pickup_latitude, pickup_longitude,
        destination_latitude, destination_longitude,
    )

    try:
        response = httpx.post(
            ORS_DIRECTIONS_URL,
            json=payload,
            headers=headers,
            timeout=ROUTE_TIMEOUT,
        )
        response.raise_for_status()
    except httpx.TimeoutException:
        logger.error("generate_route — ORS request timed out")
        raise HTTPException(
            status_code=502,
            detail="Route service timed out. Please try again later.",
        )
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        # Try to surface ORS's own error message when available.
        try:
            ors_error = exc.response.json().get("error", {})
            detail = ors_error.get("message") or ors_error or exc.response.text
        except Exception:
            detail = exc.response.text or f"ORS returned HTTP {status}"

        logger.error("generate_route — ORS HTTP %s: %s", status, detail)
        raise HTTPException(
            status_code=502,
            detail=f"Route service error (HTTP {status}): {detail}",
        )
    except httpx.RequestError as exc:
        logger.error("generate_route — network error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Route service is currently unavailable. Please try again later.",
        )

    data = response.json()

    routes = data.get("routes")
    if not routes:
        logger.warning("generate_route — ORS returned no routes in response")
        raise HTTPException(
            status_code=422,
            detail="No route could be calculated between the given coordinates. "
                   "Ensure both locations are reachable by road.",
        )

    route = routes[0]
    summary = route.get("summary", {})

    # ORS returns distance in metres and duration in seconds.
    distance_m: float = summary.get("distance", 0.0)
    duration_s: float = summary.get("duration", 0.0)
    distance_km: float = round(distance_m / 1000, 2)
    duration_min: float = round(duration_s / 60, 2)

    # Encoded polyline (ORS uses its own encoding on the geometry).
    polyline: Optional[str] = None
    geometry = route.get("geometry")
    if isinstance(geometry, str):
        polyline = geometry  # already encoded string
    elif isinstance(geometry, dict):
        # GeoJSON format — extract coordinates as a string representation.
        coords = geometry.get("coordinates", [])
        if coords:
            polyline = str(coords)

    route_summary = (
        f"{distance_km} km, approx. {duration_min} min driving"
    )

    logger.info(
        "generate_route — route calculated: %.2f km, %.2f min",
        distance_km, duration_min,
    )

    return {
        "distance_km": distance_km,
        "estimated_duration_minutes": duration_min,
        "route_summary": route_summary,
        "polyline": polyline,
    }
