import httpx
import logging

logger = logging.getLogger(__name__)

# Nominatim and OSRM API endpoints
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_URL = "http://router.project-osrm.org/route/v1/driving"

# Nominatim policy requires a proper User-Agent header identifying the app
HEADERS = {
    "User-Agent": "FleetFlow/1.0 (contact@fleetflow.com)"
}

def get_coordinates(location: str):
    """
    Uses the Nominatim API to convert a location name into coordinates.
    Returns a dict with 'latitude' and 'longitude' or None if not found or errors occur.
    """
    try:
        params = {
            "q": location,
            "format": "json",
            "limit": 1
        }
        response = httpx.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            logger.warning(f"Geocoding failed: location '{location}' not found.")
            return None
            
        return {
            "latitude": float(data[0]["lat"]),
            "longitude": float(data[0]["lon"])
        }
    except httpx.HTTPStatusError as e:
        logger.error(f"Nominatim API status error: {e.response.status_code} - {e.response.text}")
        return None
    except httpx.RequestError as e:
        logger.error(f"Nominatim network/timeout error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in geocoding: {str(e)}")
        return None

def get_route(origin_lat: float, origin_lng: float, destination_lat: float, destination_lng: float):
    """
    Uses the OSRM driving route API to compute driving paths between two coordinates.
    Returns a dict containing:
      - distance (meters)
      - duration (seconds)
      - geometry (GeoJSON LineString)
      - summary (route summary string)
    Returns None if errors occur.
    """
    try:
        # OSRM coordinates are passed as: longitude,latitude
        coordinates_str = f"{origin_lng},{origin_lat};{destination_lng},{destination_lat}"
        url = f"{OSRM_URL}/{coordinates_str}"
        params = {
            "overview": "full",
            "geometries": "geojson"
        }
        response = httpx.get(url, params=params, headers=HEADERS, timeout=15.0)
        response.raise_for_status()
        data = response.json()
        
        if "routes" not in data or len(data["routes"]) == 0:
            logger.warning("OSRM returned response but no routes list found.")
            return None
            
        route = data["routes"][0]
        return {
            "distance": float(route.get("distance", 0.0)),
            "duration": float(route.get("duration", 0.0)),
            "geometry": route.get("geometry"),
            "summary": route.get("summary", "")
        }
    except httpx.HTTPStatusError as e:
        logger.error(f"OSRM API status error: {e.response.status_code} - {e.response.text}")
        return None
    except httpx.RequestError as e:
        logger.error(f"OSRM network/timeout error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in OSRM routing: {str(e)}")
        return None
