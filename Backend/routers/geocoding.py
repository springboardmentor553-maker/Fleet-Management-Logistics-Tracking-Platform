from fastapi import APIRouter, HTTPException

from app.services.geocoding_service import get_coordinates

router = APIRouter(
    prefix="/geocode",
    tags=["Geocoding"]
)



@router.get("/")
def geocode_location(
    location: str
):

    try:

        result = get_coordinates(
            location
        )

        return {

            "location": location,

            "coordinates": result

        }


    except Exception as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        )