from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.fleet_dashboard import FleetDashboardResponse

from app.services.fleet_dashboard import get_fleet_dashboard

from app.auth.oauth2 import get_current_admin


router = APIRouter(
    prefix="/dashboard",
    tags=["Fleet Dashboard"]
)


@router.get(
    "/fleet",
    response_model=FleetDashboardResponse
)
def fleet_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return get_fleet_dashboard(db)