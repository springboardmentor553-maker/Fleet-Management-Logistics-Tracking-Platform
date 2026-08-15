import urllib.request
import urllib.parse
import json
import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class GeocodingService:
    @staticmethod
    def geocode(address: str) -> tuple[float, float]:
        """
        Geocodes an address/city name using the OpenStreetMap Nominatim API.
        Converts address name -> (latitude, longitude).
        Raises HTTPException if the address cannot be resolved or request fails.
        """
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Address/Location query cannot be empty."
            )
            
        try:
            query = urllib.parse.urlencode({"q": address, "format": "json", "limit": 1})
            url = f"https://nominatim.openstreetmap.org/search?{query}"
            
            # Nominatim REQUIRES a User-Agent to avoid blocking
            headers = {
                "User-Agent": "FleetFlowLogisticsTrackingPlatform/1.0 (contact@fleetflow.example.com)"
            }
            
            req = urllib.request.Request(url, headers=headers, method="GET")
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                if data and len(data) > 0:
                    lat = float(data[0]["lat"])
                    lon = float(data[0]["lon"])
                    return lat, lon
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Location '{address}' could not be resolved using OpenStreetMap Nominatim."
                    )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Nominatim Geocoding exception for '{address}': {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Geocoding service currently unavailable: {str(e)}"
            )
