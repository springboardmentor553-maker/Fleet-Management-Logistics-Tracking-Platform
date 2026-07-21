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
from pydantic import BaseModel
from typing import List
from app.services import route_service

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


class OptimizeRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    stops: List[List[float]]  # list of [lat, lng]


@router.post("/optimize")
def optimize_route(req: OptimizeRequest, _: User = Depends(_route_roles)):
    start = (req.origin_lat, req.origin_lng)
    stops = [tuple(s) for s in req.stops]
    ordered = route_service.optimize_nearest_neighbor(start, stops)
    # build a full route for visualization (origin -> ordered stops)
    if ordered:
        dest = ordered[-1]
        waypoints = ordered[:-1] if len(ordered) > 1 else None
        route_info = route_service.get_route(start, dest, waypoints=waypoints)
    else:
        route_info = None

    return {"ordered_stops": ordered, "route": route_info}
