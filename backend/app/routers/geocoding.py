from fastapi import APIRouter
from app.services.geocoding_service import get_coordinates

router = APIRouter(
    prefix="/geocode",
    tags=["Geocoding"]
)


@router.get("/")
def geocode(location: str):
    result = get_coordinates(location)

    if result is None:
        return {
            "message": "Location not found"
        }

    return result