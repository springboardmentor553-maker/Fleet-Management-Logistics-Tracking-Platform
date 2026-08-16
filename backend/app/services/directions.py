"""Route Generation Service – powered by OSRM (Open Source Routing Machine).

Given two coordinate pairs, fetches driving route details: distance,
duration, and encoded polyline.

OSRM demo server: http://router.project-osrm.org
  - Free to use for testing/development
  - No API key required
  - For production, self-host OSRM: https://github.com/Project-OSRM/osrm-backend

Note: OSRM coordinate order is (longitude, latitude) — opposite of Google Maps.
"""

from dataclasses import dataclass

import httpx

# Demo server – works for testing. For production, deploy your own OSRM instance.
OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"

_HEADERS = {
    "User-Agent": "FleetFlow/1.0 (fleet-management-logistics-app)"
}


class DirectionsError(Exception):
    """Raised when route generation fails or returns no routes."""


@dataclass
class RouteInfo:
    """Structured result returned by get_route()."""

    distance_text: str       # Human-readable, e.g. "1,415.3 km"
    distance_meters: int     # Raw metres for programmatic use
    duration_text: str       # Human-readable, e.g. "14 hrs 32 mins"
    duration_seconds: int    # Raw seconds for programmatic use
    summary: str             # Empty string for OSRM (no road summary in demo API)
    polyline: str | None     # Encoded polyline string (for map rendering)
    start_address: str       # Same as pickup_location (OSRM doesn't resolve addresses)
    end_address: str         # Same as destination


def _format_distance(meters: float) -> str:
    """Convert metres to a human-readable distance string."""
    km = meters / 1000
    if km >= 1:
        return f"{km:,.1f} km"
    return f"{int(meters)} m"


def _format_duration(seconds: float) -> str:
    """Convert seconds to a human-readable duration string."""
    total = int(seconds)
    hours, remainder = divmod(total, 3600)
    minutes = remainder // 60
    if hours > 0:
        return f"{hours} hr {minutes} min"
    return f"{minutes} min"


def get_route(
    pickup_lat: float,
    pickup_lng: float,
    destination_lat: float,
    destination_lng: float,
    pickup_location: str = "",
    destination_location: str = "",
) -> RouteInfo:
    """Fetch driving route information between two coordinate pairs via OSRM.

    Args:
        pickup_lat: Latitude of the pickup point.
        pickup_lng: Longitude of the pickup point.
        destination_lat: Latitude of the destination.
        destination_lng: Longitude of the destination.
        pickup_location: Optional label for start_address in the response.
        destination_location: Optional label for end_address in the response.

    Returns:
        A RouteInfo dataclass with distance, duration, and polyline.

    Raises:
        DirectionsError: If OSRM returns no routes or an error code.
        httpx.HTTPError: On network-level failures.
    """
    # OSRM format: {lng},{lat};{lng},{lat}
    coords = f"{pickup_lng},{pickup_lat};{destination_lng},{destination_lat}"
    url = f"{OSRM_BASE_URL}/{coords}"

    params = {
        "overview": "full",       # return full polyline
        "geometries": "polyline", # encoded polyline format (Google-compatible)
        "steps": "false",
    }

    response = httpx.get(url, params=params, headers=_HEADERS, timeout=15.0)
    response.raise_for_status()

    data = response.json()

    if data.get("code") != "Ok":
        raise DirectionsError(
            f"OSRM error: code={data.get('code')}, "
            f"message={data.get('message', 'unknown error')}"
        )

    routes = data.get("routes", [])
    if not routes:
        raise DirectionsError("OSRM returned no routes for the given coordinates.")

    route = routes[0]
    distance_m = route["distance"]   # metres (float)
    duration_s = route["duration"]   # seconds (float)
    polyline = route.get("geometry") # encoded polyline string

    return RouteInfo(
        distance_text=_format_distance(distance_m),
        distance_meters=int(distance_m),
        duration_text=_format_duration(duration_s),
        duration_seconds=int(duration_s),
        summary="",  # OSRM demo doesn't return road names in the route summary
        polyline=polyline,
        start_address=pickup_location or f"{pickup_lat},{pickup_lng}",
        end_address=destination_location or f"{destination_lat},{destination_lng}",
    )
