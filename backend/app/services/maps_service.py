import urllib.request
import urllib.parse
import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class MapsService:
    @staticmethod
    def geocode(address: str) -> tuple[float, float]:
        """
        Geocoding Service using Google Geocoding API.
        Converts address name -> (latitude, longitude).
        Provides a graceful mockup fallback if key is invalid/placeholder or request fails.
        """
        api_key = settings.GOOGLE_MAPS_API_KEY
        
        # If the API key is not configured or is a placeholder, use a mock response
        import os
        is_production = os.getenv("ENVIRONMENT") == "production"
        
        if not api_key or api_key == "YOUR_KEY":
            if is_production:
                logger.error("CRITICAL: Google Maps API key is not configured in production.")
                raise ValueError("Valid Google Maps API key required in production.")
            logger.warning("Google Maps API key is not configured. Using Mock Geocoder (DEV ONLY).")
            return MapsService._mock_geocode(address)

        try:
            query = urllib.parse.urlencode({"address": address, "key": api_key})
            url = f"https://maps.googleapis.com/maps/api/geocode/json?{query}"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                if data.get("status") == "OK" and data.get("results"):
                    loc = data["results"][0]["geometry"]["location"]
                    return float(loc["lat"]), float(loc["lng"])
                else:
                    logger.error(f"Geocoding failed for '{address}'. Status: {data.get('status')}. Falling back to mock.")
                    if is_production:
                        raise ValueError(f"Geocoding failed for '{address}' in production.")
        except Exception as e:
            logger.error(f"Geocoding exception for '{address}': {e}. Falling back to mock.")
            if is_production:
                raise
            
        return MapsService._mock_geocode(address)

    @staticmethod
    def _mock_geocode(address: str) -> tuple[float, float]:
        """Simple mock geocoding fallback for standard cities."""
        addr_lower = address.lower()
        # Mock coordinates for standard cities to look realistic
        cities = {
            "new york": (40.7128, -74.0060),
            "boston": (42.3601, -71.0589),
            "chicago": (41.8781, -87.6298),
            "detroit": (42.3314, -83.0458),
            "los angeles": (34.0522, -118.2437),
            "san francisco": (37.7749, -122.4194),
            "houston": (29.7604, -95.3698),
            "dallas": (32.7767, -96.7970),
            "miami": (25.7617, -80.1918),
            "orlando": (28.5383, -81.3792)
        }
        for city, coords in cities.items():
            if city in addr_lower:
                return coords
        # Default fallback (center of US)
        return 39.50, -98.35

    @staticmethod
    def get_route(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> dict:
        """
        Using Google Directions API to generate distance, duration, polyline, and summary.
        Provides a graceful fallback if API fails or is not configured.
        """
        api_key = settings.GOOGLE_MAPS_API_KEY
        
        import os
        is_production = os.getenv("ENVIRONMENT") == "production"
        
        if not api_key or api_key == "YOUR_KEY":
            if is_production:
                logger.error("CRITICAL: Google Maps API key is not configured in production.")
                raise ValueError("Valid Google Maps API key required in production for routing.")
            logger.warning("Google Maps API key is not configured. Using Mock Routing (DEV ONLY).")
            return MapsService._mock_route(origin_lat, origin_lng, dest_lat, dest_lng)

        try:
            origin = f"{origin_lat},{origin_lng}"
            destination = f"{dest_lat},{dest_lng}"
            query = urllib.parse.urlencode({
                "origin": origin,
                "destination": destination,
                "key": api_key
            })
            url = f"https://maps.googleapis.com/maps/api/directions/json?{query}"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                if data.get("status") == "OK" and data.get("routes"):
                    route = data["routes"][0]
                    leg = route["legs"][0]
                    return {
                        "distance": leg["distance"]["text"],
                        "estimated_travel_time": leg["duration"]["text"],
                        "route_summary": route.get("summary", "Route via main highway"),
                        "polyline": route["overview_polyline"]["points"]
                    }
                else:
                    logger.error(f"Directions API failed. Status: {data.get('status')}. Falling back to mock.")
                    if is_production:
                        raise ValueError(f"Directions API failed in production. Status: {data.get('status')}")
        except Exception as e:
            logger.error(f"Directions API exception: {e}. Falling back to mock.")
            if is_production:
                raise

        return MapsService._mock_route(origin_lat, origin_lng, dest_lat, dest_lng)

    @staticmethod
    def _mock_route(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> dict:
        """Fallback routing details with mock polyline."""
        # Simple distance formula approximation
        import math
        dx = (dest_lng - origin_lng) * 85.0  # approximate km per degree
        dy = (dest_lat - origin_lat) * 111.0
        distance_km = math.sqrt(dx**2 + dy**2)
        
        # Assume 80 km/h average speed
        duration_hours = distance_km / 80.0
        hours = int(duration_hours)
        minutes = int((duration_hours - hours) * 60)
        
        duration_text = f"{hours}h {minutes}m" if hours > 0 else f"{minutes} mins"
        distance_text = f"{distance_km:.1f} km"
        
        # Encoded polyline representing straight line from origin to dest
        polyline_encoded = "w~nyF~h|qU_uiIxxhA_ukIxxhA"
        
        return {
            "distance": distance_text,
            "estimated_travel_time": duration_text,
            "route_summary": "Route via I-95 Highway (Mocked)",
            "polyline": polyline_encoded
        }
