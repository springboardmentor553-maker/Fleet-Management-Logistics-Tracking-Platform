from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.dashboard import DashboardResponse
from app.services.dashboard import get_dashboard_data

from app.auth.oauth2 import (
    get_current_user,
    get_current_admin,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/", response_model=DashboardResponse)
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return get_dashboard_data(db)