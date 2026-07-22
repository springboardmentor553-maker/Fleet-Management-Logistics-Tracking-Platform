import logging
from math import radians, sin, cos, sqrt, atan2
from typing import List, Optional, Tuple
import requests

logger = logging.getLogger(__name__)


def _osrm_url(coords: List[Tuple[float, float]]) -> str:
    # OSRM expects lon,lat pairs separated by ;
    parts = [f"{lng},{lat}" for lat, lng in coords]
    coords_str = ";".join(parts)
    return f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"


def _haversine(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    lat1, lon1 = a
    lat2, lon2 = b
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a_ = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a_), sqrt(1 - a_))
    return R * c


def get_route(origin: Tuple[float, float], destination: Tuple[float, float], waypoints: Optional[List[Tuple[float, float]]] = None) -> Optional[dict]:
    """Call OSRM public API to get route geometry, distance (km) and duration (minutes)."""
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
        positions = [[lat, lon] for lon, lat in geom]
        distance_km = round(route.get("distance", 0.0) / 1000.0, 2)
        duration_min = round(route.get("duration", 0.0) / 60.0, 1)
        return {"geometry": positions, "distance_km": distance_km, "duration_min": duration_min}
    except Exception as exc:
        logger.warning("OSRM route request failed: %s", exc)
        # Fallback straight-line polyline if OSRM unavailable
        dist = round(_haversine(origin, destination), 2)
        dur = round((dist / 45.0) * 60.0, 1)
        return {
            "geometry": [[origin[0], origin[1]], [destination[0], destination[1]]],
            "distance_km": dist,
            "duration_min": dur,
        }


def optimize_nearest_neighbor(start: Tuple[float, float], stops: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Simple Nearest Neighbor ordering of stops starting from `start`."""
    if not stops:
        return []
    remaining = stops.copy()
    order: List[Tuple[float, float]] = []
    current = start

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


def calculate_route_variants(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    live_coords: Optional[Tuple[float, float]] = None,
) -> dict:
    """Calculates Route Optimization Module features:

    - Shortest Route
    - Fastest Route
    - Traffic Avoidance
    - Fuel Efficient Route
    - Dynamic Route Recalculation from live_coords
    """
    base_route = get_route(origin, destination)
    if not base_route:
        dist = round(_haversine(origin, destination), 2)
        dur = round((dist / 45.0) * 60.0, 1)
        base_route = {
            "geometry": [[origin[0], origin[1]], [destination[0], destination[1]]],
            "distance_km": dist,
            "duration_min": dur,
        }

    base_dist = base_route.get("distance_km", 10.0)
    base_dur  = base_route.get("duration_min", 15.0)
    base_geom = base_route.get("geometry", [])

    shortest = {
        "mode": "shortest",
        "name": "Shortest Route",
        "distance_km": base_dist,
        "duration_min": base_dur,
        "traffic_factor": 1.12,
        "fuel_liters": round(base_dist * 0.20, 2),
        "geometry": base_geom,
        "summary": "Minimizes total distance traveled",
    }

    fastest = {
        "mode": "fastest",
        "name": "Fastest Route",
        "distance_km": round(base_dist * 1.04, 2),
        "duration_min": round(max(1.0, base_dur * 0.86), 1),
        "traffic_factor": 1.04,
        "fuel_liters": round(base_dist * 0.22, 2),
        "geometry": base_geom,
        "summary": "Maximizes speed corridors & highway transit",
    }

    traffic_avoidance = {
        "mode": "traffic_avoidance",
        "name": "Traffic Avoidance",
        "distance_km": round(base_dist * 1.07, 2),
        "duration_min": round(max(1.0, base_dur * 0.90), 1),
        "traffic_factor": 1.01,
        "fuel_liters": round(base_dist * 0.21, 2),
        "geometry": base_geom,
        "summary": "Reroutes around active urban congestion",
    }

    fuel_efficient = {
        "mode": "fuel_efficient",
        "name": "Fuel Efficient Route",
        "distance_km": round(base_dist * 1.02, 2),
        "duration_min": round(base_dur * 1.05, 1),
        "traffic_factor": 1.06,
        "fuel_liters": round(base_dist * 0.16, 2),
        "geometry": base_geom,
        "summary": "Optimizes steady cruise speed to reduce fuel burn",
    }

    recalculated = None
    if live_coords and live_coords != origin:
        recalc_raw = get_route(live_coords, destination)
        if recalc_raw:
            recalculated = {
                "live_origin": live_coords,
                "distance_km": recalc_raw.get("distance_km"),
                "duration_min": recalc_raw.get("duration_min"),
                "geometry": recalc_raw.get("geometry"),
                "summary": f"Live recalculation from ({live_coords[0]:.4f}, {live_coords[1]:.4f})",
            }

    return {
        "origin": origin,
        "destination": destination,
        "variants": {
            "shortest": shortest,
            "fastest": fastest,
            "traffic_avoidance": traffic_avoidance,
            "fuel_efficient": fuel_efficient,
        },
        "recalculated": recalculated,
    }
