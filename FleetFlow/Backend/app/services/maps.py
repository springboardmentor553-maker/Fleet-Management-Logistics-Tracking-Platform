import hashlib
from math import atan2, cos, radians, sin, sqrt
from typing import Any, Dict, Tuple

import requests

from app.config import settings


class MapsServiceError(Exception):
    pass


KNOWN_LOCATIONS = {
    "chennai": (13.0827, 80.2707),
    "mumbai": (19.0760, 72.8777),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "delhi": (28.7041, 77.1025),
    "kolkata": (22.5726, 88.3639),
    "hyderabad": (17.3850, 78.4867),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "jaipur": (26.9124, 75.7873),
    "coimbatore": (11.0168, 76.9558),
    "kochi": (9.9312, 76.2673),
    "vizag": (17.6868, 83.2185),
    "visakhapatnam": (17.6868, 83.2185),
    "madurai": (9.9252, 78.1198),
    "tiruchirappalli": (10.7905, 78.7047),
    "salem": (11.6643, 78.1460),
    "trivandrum": (8.5241, 76.9366),
    "thiruvananthapuram": (8.5241, 76.9366),
    "gurgaon": (28.4595, 77.0266),
    "noida": (28.5355, 77.3910),
    "lucknow": (26.8467, 80.9462),
    "chandigarh": (30.7333, 76.7794),
    "bhubaneswar": (20.2961, 85.8245),
    "bhopal": (23.2599, 77.4126),
    "indore": (22.7196, 75.8577),
    "nagpur": (21.1458, 79.0882),
    "surat": (21.1702, 72.8311),
    "vadodara": (22.3072, 73.1812),
    "rajkot": (22.3039, 70.8022),
    "london": (51.5072, -0.1276),
    "new york": (40.7128, -74.0060),
    "singapore": (1.3521, 103.8198),
    "dubai": (25.2048, 55.2708),
}

DEFAULT_BASE_LAT = 10.0
DEFAULT_BASE_LNG = 75.0


def _normalize_location(location: str) -> str:
    return (location or "").strip().lower()


def _fallback_coordinates(location: str) -> Dict[str, Any]:
    normalized = _normalize_location(location)
    if normalized in KNOWN_LOCATIONS:
        lat, lng = KNOWN_LOCATIONS[normalized]
        return {
            "latitude": lat,
            "longitude": lng,
            "formatted_address": location.strip(),
            "source": "fallback-known-location",
        }

    digest = hashlib.md5(normalized.encode("utf-8")).hexdigest()
    lat = 8.0 + (int(digest[:6], 16) % 2400) / 100.0
    lng = 68.0 + (int(digest[6:12], 16) % 2400) / 100.0
    return {
        "latitude": lat,
        "longitude": lng,
        "formatted_address": location.strip(),
        "source": "fallback-hash",
    }


def _geocode_with_nominatim(location: str) -> Dict[str, Any] | None:
    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": location, "format": "jsonv2", "limit": 1, "addressdetails": 1},
            headers={"User-Agent": "FleetFlow/1.0"},
            timeout=8,
        )
        response.raise_for_status()
        payload = response.json()
        if payload:
            result = payload[0]
            return {
                "latitude": float(result.get("lat")),
                "longitude": float(result.get("lon")),
                "formatted_address": result.get("display_name"),
                "source": "nominatim",
            }
    except Exception:
        return None


def geocode_location(location: str) -> Dict[str, Any]:
    if not location or not str(location).strip():
        raise MapsServiceError("Location is required")

    normalized = _normalize_location(location)
    if normalized in KNOWN_LOCATIONS:
        lat, lng = KNOWN_LOCATIONS[normalized]
        return {
            "latitude": lat,
            "longitude": lng,
            "formatted_address": location.strip(),
            "source": "fallback-known-location",
        }

    if settings.GOOGLE_MAPS_API_KEY:
        try:
            response = requests.get(
                settings.GOOGLE_MAPS_GEOCODING_URL,
                params={"address": location, "key": settings.GOOGLE_MAPS_API_KEY},
                timeout=10,
            )
            response.raise_for_status()
            payload = response.json()
            if payload.get("status") == "OK" and payload.get("results"):
                result = payload["results"][0]
                geometry = result.get("geometry", {})
                loc = geometry.get("location", {})
                return {
                    "latitude": loc.get("lat"),
                    "longitude": loc.get("lng"),
                    "formatted_address": result.get("formatted_address"),
                    "source": "google-geocoding",
                }
        except Exception:
            pass

    nominatim_result = _geocode_with_nominatim(location)
    if nominatim_result:
        return nominatim_result

    return _fallback_coordinates(location)


def get_route_between_locations(origin: Tuple[float, float], destination: Tuple[float, float]) -> Dict[str, Any]:
    origin_lat, origin_lng = origin
    destination_lat, destination_lng = destination

    if settings.GOOGLE_MAPS_API_KEY:
        try:
            response = requests.get(
                settings.GOOGLE_MAPS_DIRECTIONS_URL,
                params={
                    "origin": f"{origin_lat},{origin_lng}",
                    "destination": f"{destination_lat},{destination_lng}",
                    "mode": "driving",
                    "key": settings.GOOGLE_MAPS_API_KEY,
                },
                timeout=10,
            )
            response.raise_for_status()
            payload = response.json()
            if payload.get("status") == "OK" and payload.get("routes"):
                route = payload["routes"][0]
                leg = route.get("legs", [{}])[0]
                distance = leg.get("distance", {})
                duration = leg.get("duration", {})
                return {
                    "distance_meters": distance.get("value"),
                    "distance_text": distance.get("text"),
                    "duration_seconds": duration.get("value"),
                    "duration_text": duration.get("text"),
                    "polyline": route.get("overview_polyline", {}).get("points"),
                    "summary": route.get("summary") or "Google route",
                    "source": "google-directions",
                }
        except Exception:
            pass

    distance_km = haversine_distance(origin_lat, origin_lng, destination_lat, destination_lng)
    duration_min = round((distance_km / 45.0) * 60.0, 1)
    return {
        "distance_meters": round(distance_km * 1000.0, 1),
        "distance_text": f"{distance_km:.1f} km",
        "duration_seconds": round(duration_min * 60.0, 1),
        "duration_text": f"{int(duration_min)} mins",
        "polyline": None,
        "summary": "Fallback route based on straight-line estimate",
        "source": "fallback",
    }


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return r * c
