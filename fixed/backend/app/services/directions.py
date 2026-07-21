import httpx
from fastapi import HTTPException, status

# OSRM (Open Source Routing Machine) public demo server. No API key required.
# Demo server usage policy: light/non-commercial use, fine for a student project.
# https://project-osrm.org/
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"


class RouteResult:
    def __init__(
        self,
        distance_text: str,
        distance_meters: float,
        duration_text: str,
        duration_seconds: float,
        polyline: str | None,
        summary: str,
    ):
        self.distance_text = distance_text
        self.distance_meters = distance_meters
        self.duration_text = duration_text
        self.duration_seconds = duration_seconds
        self.polyline = polyline
        self.summary = summary


def _format_distance(meters: float) -> str:
    km = meters / 1000
    return f"{km:.1f} km"


def _format_duration(seconds: float) -> str:
    minutes = round(seconds / 60)
    if minutes < 60:
        return f"{minutes} min"
    hours, mins = divmod(minutes, 60)
    return f"{hours} hr {mins} min" if mins else f"{hours} hr"


def get_route(
    pickup_lat: float,
    pickup_lng: float,
    destination_lat: float,
    destination_lng: float,
) -> RouteResult:
    """Task 4: receives pickup and destination coordinates and retrieves
    total distance, estimated travel duration, and route polyline (if
    available) using the free OSRM routing service."""
    coords = f"{pickup_lng},{pickup_lat};{destination_lng},{destination_lat}"

    response = httpx.get(
        f"{OSRM_URL}/{coords}",
        params={"overview": "full", "geometries": "polyline"},
        timeout=10.0,
    )
    response.raise_for_status()
    data = response.json()

    if data.get("code") != "Ok" or not data.get("routes"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not generate route: {data.get('code', 'unknown error')}",
        )

    route = data["routes"][0]
    distance_meters = route["distance"]
    duration_seconds = route["duration"]

    return RouteResult(
        distance_text=_format_distance(distance_meters),
        distance_meters=distance_meters,
        duration_text=_format_duration(duration_seconds),
        duration_seconds=duration_seconds,
        polyline=route.get("geometry"),
        summary="Fastest route",
    )
