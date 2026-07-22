from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.route import RouteEstimate
from app.services.route import build_route_estimate
from app.services import route_service

router = APIRouter(prefix="/route", tags=["Route"])

_route_roles = require_roles(Role.ADMIN, Role.FLEET_MANAGER, Role.DISPATCHER)


@router.get("/estimate/{shipment_id}", response_model=RouteEstimate)
def get_route_estimate(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
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
def optimize_route(req: OptimizeRequest, _: User = Depends(get_current_user)):
    start = (req.origin_lat, req.origin_lng)
    stops = [tuple(s) for s in req.stops]
    ordered = route_service.optimize_nearest_neighbor(start, stops)
    if ordered:
        dest = ordered[-1]
        waypoints = ordered[:-1] if len(ordered) > 1 else None
        route_info = route_service.get_route(start, dest, waypoints=waypoints)
    else:
        route_info = None

    return {"ordered_stops": ordered, "route": route_info}


class RouteVariantsRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    live_lat: Optional[float] = None
    live_lng: Optional[float] = None


@router.post("/variants")
def get_route_variants(req: RouteVariantsRequest, _: User = Depends(get_current_user)):
    origin = (req.origin_lat, req.origin_lng)
    destination = (req.destination_lat, req.destination_lng)
    live_coords = (req.live_lat, req.live_lng) if req.live_lat is not None and req.live_lng is not None else None
    return route_service.calculate_route_variants(origin, destination, live_coords=live_coords)
