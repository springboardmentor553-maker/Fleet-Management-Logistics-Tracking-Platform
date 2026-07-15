"""Google Maps Directions (Route) Service.

Given two sets of coordinates, fetches the route details from the
Google Directions API, including total distance, duration, and the
encoded polyline for map rendering.

API docs: https://developers.google.com/maps/documentation/directions
"""

from dataclasses import dataclass

import httpx

from app.config import settings


DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"


class DirectionsError(Exception):
    """Raised when the Directions API returns an error or no routes."""


@dataclass
class RouteInfo:
    """Structured result returned by get_route()."""

    distance_text: str          # e.g. "1,234 km"
    distance_meters: int        # raw meters for programmatic use
    duration_text: str          # e.g. "14 hours 32 mins"
    duration_seconds: int       # raw seconds for programmatic use
    summary: str                # e.g. "NH48" – primary road used
    polyline: str | None        # encoded polyline string (for map rendering)
    start_address: str          # resolved address of the origin
    end_address: str            # resolved address of the destination


def get_route(
    pickup_lat: float,
    pickup_lng: float,
    destination_lat: float,
    destination_lng: float,
) -> RouteInfo:
    """Fetch route information between two coordinate pairs.

    Args:
        pickup_lat: Latitude of the pickup point.
        pickup_lng: Longitude of the pickup point.
        destination_lat: Latitude of the destination.
        destination_lng: Longitude of the destination.

    Returns:
        A RouteInfo dataclass with distance, duration, summary, and polyline.

    Raises:
        DirectionsError: If the API returns no routes or an error status.
        httpx.HTTPError: On network-level failures.
    """
    if not settings.google_maps_api_key:
        raise DirectionsError(
            "GOOGLE_MAPS_API_KEY is not configured. "
            "Set it in your .env file before using route generation."
        )

    params = {
        "origin": f"{pickup_lat},{pickup_lng}",
        "destination": f"{destination_lat},{destination_lng}",
        "key": settings.google_maps_api_key,
        # Driving mode is the default; change to "walking" or "transit" if needed
        "mode": "driving",
    }

    response = httpx.get(DIRECTIONS_URL, params=params, timeout=15.0)
    response.raise_for_status()

    data = response.json()

    if data.get("status") != "OK":
        raise DirectionsError(
            f"Directions API error: status={data.get('status')}, "
            f"error_message={data.get('error_message', 'none')}"
        )

    routes = data.get("routes", [])
    if not routes:
        raise DirectionsError("No routes returned by the Directions API")

    route = routes[0]
    leg = route["legs"][0]  # We send origin→destination directly, so one leg

    # Extract distance and duration from the first leg
    distance = leg["distance"]
    duration = leg["duration"]

    # The encoded polyline covers the entire route
    polyline = route.get("overview_polyline", {}).get("points")

    return RouteInfo(
        distance_text=distance["text"],
        distance_meters=distance["value"],
        duration_text=duration["text"],
        duration_seconds=duration["value"],
        summary=route.get("summary", ""),
        polyline=polyline,
        start_address=leg.get("start_address", ""),
        end_address=leg.get("end_address", ""),
    )
