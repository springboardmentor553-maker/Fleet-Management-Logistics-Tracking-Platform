from fastapi import APIRouter, HTTPException

from app.services.geocoding_service import get_coordinates


router = APIRouter(
    prefix="/geocoding",
    tags=["Geocoding"]
)


@router.get("/")
def geocode_location(location: str):

    coordinates = get_coordinates(location)

    if not coordinates:
        raise HTTPException(
            status_code=404,
            detail="Location not found"
        )

    return {
        "location": location,
        "latitude": coordinates["latitude"],
        "longitude": coordinates["longitude"]
    }