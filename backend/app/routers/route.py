from fastapi import APIRouter
from app.services.route_service import get_route

router = APIRouter(
    prefix="/route",
    tags=["Route"]
)


@router.get("/")
def calculate_route(
    pickup_lat: float,
    pickup_lon: float,
    destination_lat: float,
    destination_lon: float
):
    result = get_route(
        pickup_lat,
        pickup_lon,
        destination_lat,
        destination_lon
    )

    if result is None:
        return {
            "message": "Route not found"
        }

    return {
        "pickup_coordinates": {
            "latitude": pickup_lat,
            "longitude": pickup_lon
        },
        "destination_coordinates": {
            "latitude": destination_lat,
            "longitude": destination_lon
        },
        "distance": f"{result['distance_km']} km",
        "estimated_travel_time": f"{result['duration_minutes']} minutes",
        "route_summary": "Route generated successfully",
        "polyline": result["polyline"]
    }