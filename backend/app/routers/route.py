from fastapi import APIRouter

from app.services.geocoding_service import get_coordinates
from app.services.route_service import get_route
from app.services.eta_service import calculate_eta
router = APIRouter(
    prefix="/route",
    tags=["Route"]
)


@router.get("/")
def route_details(
    pickup_location: str,
    destination: str
):

    pickup = get_coordinates(pickup_location)

    if not pickup:
        return {
            "message": "Pickup location not found"
        }

    destination_coordinates = get_coordinates(destination)

    if not destination_coordinates:
        return {
            "message": "Destination not found"
        }

    route = get_route(
        pickup["latitude"],
        pickup["longitude"],
        destination_coordinates["latitude"],
        destination_coordinates["longitude"]
    )

    if not route:
        return {
            "message": "Route not found"
        }

    eta = calculate_eta(
        route["estimated_duration_minutes"]
    )

    return {
        "pickup_location": pickup_location,
        "destination": destination,
        "pickup_coordinates": pickup,
        "destination_coordinates": destination_coordinates,
        "distance": f'{route["distance_km"]} km',
        "estimated_travel_time": f'{route["estimated_duration_minutes"]} minutes',
        "estimated_arrival_time": eta,
        "route_summary": "Generated using OpenStreetMap + OSRM"
    }