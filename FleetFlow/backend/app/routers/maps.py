from fastapi import APIRouter, HTTPException

from app.schemas.maps import RouteRequest, RouteResponse
from app.services.maps import get_route

router = APIRouter(
    prefix="/maps",
    tags=["Maps"]
)


@router.post("/route", response_model=RouteResponse)
def calculate_route(request: RouteRequest):
    try:
        return get_route(
            request.origin,
            request.destination
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )