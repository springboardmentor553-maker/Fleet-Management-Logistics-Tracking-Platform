from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.route import RouteEstimate
from app.services.route import build_route_estimate

router = APIRouter(prefix="/route", tags=["Route"])

_route_roles = require_roles(Role.ADMIN, Role.FLEET_MANAGER, Role.DISPATCHER)


@router.get("/estimate/{shipment_id}", response_model=RouteEstimate)
def get_route_estimate(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_route_roles),
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

    drivers = db.query(Driver).order_by(Driver.id).all()
    vehicles = db.query(Vehicle).order_by(Vehicle.id).all()
    estimate = build_route_estimate(shipment, drivers, vehicles)
    return estimate
