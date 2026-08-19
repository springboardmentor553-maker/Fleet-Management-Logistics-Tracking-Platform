from fastapi import APIRouter, HTTPException

from app.services.routing_service import generate_route

router = APIRouter(
    prefix="/routing",
    tags=["Routing"]
)


@router.get("/generate")
def get_route(
    pickup_lat: float,
    pickup_lon: float,
    destination_lat: float,
    destination_lon: float
):
    try:
        return generate_route(
            pickup_lat,
            pickup_lon,
            destination_lat,
            destination_lon
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )