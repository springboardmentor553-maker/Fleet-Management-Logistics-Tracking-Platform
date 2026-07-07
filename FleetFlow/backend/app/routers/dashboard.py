from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import Vehicle, VehicleStatusEnum, User
from app.schemas.dashboard import DashboardSummary
from app.services.security import get_current_user


router = APIRouter()


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> DashboardSummary:
    total_vehicles = db.query(func.count(Vehicle.id)).scalar() or 0
    active = db.query(func.count(Vehicle.id)).filter(Vehicle.current_status == VehicleStatusEnum.IN_USE).scalar() or 0
    maintenance = db.query(func.count(Vehicle.id)).filter(Vehicle.current_status == VehicleStatusEnum.MAINTENANCE).scalar() or 0
    available = db.query(func.count(Vehicle.id)).filter(Vehicle.current_status == VehicleStatusEnum.AVAILABLE).scalar() or 0

    return DashboardSummary(
        totalVehicles=total_vehicles,
        active=active,
        maintenance=maintenance,
        available=available,
    )