from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.vehicle import Vehicle
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)
@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):

    total = db.query(Vehicle).count()

    available = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    maintenance = db.query(Vehicle).filter(
        Vehicle.status == "Maintenance"
    ).count()

    on_trip = db.query(Vehicle).filter(
        Vehicle.status == "On Trip"
    ).count()

    inactive = db.query(Vehicle).filter(
        Vehicle.status == "Inactive"
    ).count()

    active = total - inactive

    return {
        "totalVehicles": total,
        "active": active,
        "available": available,
        "maintenance": maintenance,
        "onTrip": on_trip,
        "inactive": inactive
    }