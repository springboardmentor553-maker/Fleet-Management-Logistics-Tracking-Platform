import urllib.request
import json
import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class RouteService:
    @staticmethod
    def get_route(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> dict:
        """
        Retrieves routing details using the free OSRM Routing API.
        Returns:
            - distance_km (float)
            - estimated_duration (str) e.g., "8 Hours 20 Minutes"
            - route_summary (str)
            - route_geometry (list of [lat, lng] lists)
        """
        try:
            url = f"https://router.project-osrm.org/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=full&geometries=geojson"
            
            headers = {
                "User-Agent": "FleetFlowLogisticsTrackingPlatform/1.0 (contact@fleetflow.example.com)"
            }
            
            req = urllib.request.Request(url, headers=headers, method="GET")
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    leg = route["legs"][0]
                    
                    # Convert distance from meters to kilometers
                    distance_m = route.get("distance", 0.0)
                    distance_km = round(distance_m / 1000.0, 2)
                    
                    # Convert duration from seconds to hours and minutes
                    duration_sec = route.get("duration", 0.0)
                    hours = int(duration_sec // 3600)
                    minutes = int((duration_sec % 3600) // 60)
                    
                    if hours > 0:
                        estimated_duration = f"{hours} Hours {minutes} Minutes"
                    else:
                        estimated_duration = f"{minutes} Minutes"
                        
                    # Get summary
                    route_summary = leg.get("summary", "")
                    if not route_summary:
                        route_summary = "NH44 / Highway Route" # default summary
                        
                    # Extract GeoJSON coordinates and convert to [latitude, longitude] list
                    # OSRM returns coordinates as [lon, lat], swap to [lat, lon]
                    geojson = route.get("geometry", {})
                    coordinates = geojson.get("coordinates", [])
                    route_geometry = [[coord[1], coord[0]] for coord in coordinates]
                    
                    return {
                        "distance_km": distance_km,
                        "estimated_duration": estimated_duration,
                        "route_summary": route_summary,
                        "route_geometry": route_geometry
                    }
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="OSRM failed to generate a route between coordinates."
                    )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"OSRM Routing exception: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Routing service currently unavailable: {str(e)}"
            )
