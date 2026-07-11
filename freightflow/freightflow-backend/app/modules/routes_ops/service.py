from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.exceptions import ConflictError, NotFoundError
from app.modules.routes_ops.models import TripRoute
from app.modules.routes_ops.schemas import TripRouteCreate, TripRouteUpdate
from app.modules.shipments.models import Shipment


def get_route_or_404(db: Session, route_id: int) -> TripRoute:
    route = db.get(TripRoute, route_id)
    if route is None:
        raise NotFoundError(f"Route {route_id} was not found")
    return route


def get_route_for_shipment(db: Session, shipment_id: int) -> TripRoute:
    route = db.scalar(select(TripRoute).where(TripRoute.shipment_id == shipment_id))
    if route is None:
        raise NotFoundError(f"No route has been planned for shipment {shipment_id}")
    return route


def create_route(db: Session, payload: TripRouteCreate, planned_by: int) -> TripRoute:
    shipment = db.get(Shipment, payload.shipment_id)
    if shipment is None:
        raise NotFoundError(f"Shipment {payload.shipment_id} was not found")

    existing = db.scalar(select(TripRoute).where(TripRoute.shipment_id == payload.shipment_id))
    if existing is not None:
        raise ConflictError("A route has already been planned for this shipment")

    route = TripRoute(
        shipment_id=payload.shipment_id,
        waypoints=[wp.model_dump() for wp in payload.waypoints],
        distance_km=payload.distance_km,
        estimated_duration_min=payload.estimated_duration_min,
        planned_by=planned_by,
    )
    db.add(route)
    db.commit()
    db.refresh(route)
    return route


def update_route(db: Session, route_id: int, payload: TripRouteUpdate) -> TripRoute:
    route = get_route_or_404(db, route_id)
    update_data = payload.model_dump(exclude_unset=True)
    if "waypoints" in update_data and update_data["waypoints"] is not None:
        update_data["waypoints"] = [wp if isinstance(wp, dict) else wp.model_dump() for wp in update_data["waypoints"]]
    for field, value in update_data.items():
        setattr(route, field, value)
    db.commit()
    db.refresh(route)
    return route


def delete_route(db: Session, route_id: int) -> None:
    route = get_route_or_404(db, route_id)
    db.delete(route)
    db.commit()
