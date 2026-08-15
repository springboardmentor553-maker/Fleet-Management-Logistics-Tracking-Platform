from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.fuel_analytics import FuelAnalyticsResponse

from app.services.fuel_analytics import get_fuel_analytics

from app.auth.oauth2 import get_current_admin


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get(
    "/fuel",
    response_model=FuelAnalyticsResponse
)
def fuel_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return get_fuel_analytics(db)