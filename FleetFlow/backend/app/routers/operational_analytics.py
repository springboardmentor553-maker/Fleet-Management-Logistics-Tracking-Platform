from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.operational_analytics import (
    OperationalAnalyticsResponse
)

from app.services.operational_analytics import (
    get_operational_analytics
)

from app.auth.oauth2 import get_current_admin


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get(
    "/operations",
    response_model=OperationalAnalyticsResponse
)
def operational_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return get_operational_analytics(db)