from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import (
    get_db,
    require_role
)
from app.models.vehicle import Vehicle
from app.models.user import User

router = APIRouter()


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "fleet manager",
            "dispatcher"
        )
    )
):
    vehicles = db.query(Vehicle).all()

    total = len(vehicles)
    available = sum(
        v.status.lower() == "available"
        for v in vehicles
    )

    maintenance = sum(
        v.status.lower() == "maintenance"
        for v in vehicles
    )

    active = total - maintenance

    return {
        "totalVehicles": total,
        "active": active,
        "maintenance": maintenance,
        "available": available
    }