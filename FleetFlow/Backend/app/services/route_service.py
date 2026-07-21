import logging
from typing import List, Optional, Tuple

import requests

logger = logging.getLogger(__name__)


def _osrm_url(coords: List[Tuple[float, float]]) -> str:
    # OSRM expects lon,lat pairs separated by ;
    parts = [f"{lng},{lat}" for lat, lng in coords]
    coords_str = ";".join(parts)
    return f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"


def get_route(origin: Tuple[float, float], destination: Tuple[float, float], waypoints: Optional[List[Tuple[float, float]]] = None) -> Optional[dict]:
    """Call OSRM public API to get route geometry, distance (km) and duration (minutes).

    Returns dict with keys: geometry (list of [lat, lng]), distance_km, duration_min
    or None on failure.
    """
    coords = [origin]
    if waypoints:
        coords.extend(waypoints)
    coords.append(destination)

    url = _osrm_url(coords)
    try:
        resp = requests.get(url, timeout=6)
        resp.raise_for_status()
        data = resp.json()
        if not data.get("routes"):
            return None
        route = data["routes"][0]
        geom = route.get("geometry", {}).get("coordinates", [])
        # OSRM returns [lon, lat] — convert to [lat, lon]
        positions = [[lat, lon] for lon, lat in geom]
        distance_km = round(route.get("distance", 0.0) / 1000.0, 2)
        duration_min = round(route.get("duration", 0.0) / 60.0, 1)
        return {"geometry": positions, "distance_km": distance_km, "duration_min": duration_min}
    except Exception as exc:
        logger.warning("OSRM route request failed: %s", exc)
        return None


def optimize_nearest_neighbor(start: Tuple[float, float], stops: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Simple Nearest Neighbor ordering of stops starting from `start`."""
    if not stops:
        return []
    remaining = stops.copy()
    order: List[Tuple[float, float]] = []
    current = start
    # simple haversine used here to order; keep local implementation to avoid extra deps
    from math import radians, sin, cos, sqrt, atan2

    def _haversine(a, b):
        lat1, lon1 = a
        lat2, lon2 = b
        R = 6371.0
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a_ = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a_), sqrt(1 - a_))
        return R * c

    while remaining:
        best = None
        best_dist = None
        for r in remaining:
            d = _haversine(current, r)
            if best is None or d < best_dist:
                best = r
                best_dist = d
        order.append(best)
        remaining.remove(best)
        current = best

    return order
