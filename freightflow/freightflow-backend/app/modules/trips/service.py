
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common.enums import TripStatus
from app.common.exceptions import ConflictError, NotFoundError
from app.modules.drivers.models import Driver
from app.modules.fleet.models import Vehicle
from app.modules.shipments.models import Shipment
from app.modules.trips.models import Trip
from app.modules.trips.schemas import TripCreate, TripUpdate

# A driver/vehicle is considered "busy" while a trip is in one of these states.
ACTIVE_TRIP_STATUSES = (TripStatus.SCHEDULED, TripStatus.IN_PROGRESS)


def get_trip_or_404(db: Session, trip_id: int) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise NotFoundError(f"Trip {trip_id} was not found")
    return trip


def list_trips(
    db: Session, offset: int, limit: int, status_filter: TripStatus | None = None
) -> tuple[list[Trip], int]:
    query = select(Trip)
    if status_filter is not None:
        query = query.where(Trip.status == status_filter)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Trip.id).offset(offset).limit(limit)).all()
    return list(items), total


def _get_shipment_or_404(db: Session, shipment_id: int) -> Shipment:
    shipment = db.get(Shipment, shipment_id)
    if shipment is None:
        raise NotFoundError(f"Shipment {shipment_id} was not found")
    return shipment


def _get_driver_or_404(db: Session, driver_id: int) -> Driver:
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise NotFoundError(f"Driver {driver_id} was not found")
    return driver


def _get_vehicle_or_404(db: Session, vehicle_id: int) -> Vehicle:
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise NotFoundError(f"Vehicle {vehicle_id} was not found")
    return vehicle


def _ensure_shipment_not_already_tripped(db: Session, shipment_id: int, ignore_trip_id: int | None = None) -> None:
    query = select(Trip).where(Trip.shipment_id == shipment_id)
    if ignore_trip_id is not None:
        query = query.where(Trip.id != ignore_trip_id)
    if db.scalar(query) is not None:
        raise ConflictError(f"Shipment {shipment_id} is already assigned to a trip")


def _ensure_driver_available(db: Session, driver_id: int, ignore_trip_id: int | None = None) -> None:
    query = select(Trip).where(Trip.driver_id == driver_id, Trip.status.in_(ACTIVE_TRIP_STATUSES))
    if ignore_trip_id is not None:
        query = query.where(Trip.id != ignore_trip_id)
    if db.scalar(query) is not None:
        raise ConflictError(f"Driver {driver_id} already has an active trip")


def _ensure_vehicle_available(db: Session, vehicle_id: int, ignore_trip_id: int | None = None) -> None:
    query = select(Trip).where(Trip.vehicle_id == vehicle_id, Trip.status.in_(ACTIVE_TRIP_STATUSES))
    if ignore_trip_id is not None:
        query = query.where(Trip.id != ignore_trip_id)
    if db.scalar(query) is not None:
        raise ConflictError(f"Vehicle {vehicle_id} already has an active trip")


def create_trip(db: Session, payload: TripCreate) -> Trip:
    # Task 4: validate shipment / driver / vehicle exist.
    _get_shipment_or_404(db, payload.shipment_id)
    _get_driver_or_404(db, payload.driver_id)
    _get_vehicle_or_404(db, payload.vehicle_id)

    # Task 5: prevent double assignment.
    _ensure_shipment_not_already_tripped(db, payload.shipment_id)
    _ensure_driver_available(db, payload.driver_id)
    _ensure_vehicle_available(db, payload.vehicle_id)

    trip = Trip(**payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def update_trip(db: Session, trip_id: int, payload: TripUpdate) -> Trip:
    trip = get_trip_or_404(db, trip_id)
    updates = payload.model_dump(exclude_unset=True)

    if "driver_id" in updates and updates["driver_id"] != trip.driver_id:
        _get_driver_or_404(db, updates["driver_id"])
        _ensure_driver_available(db, updates["driver_id"], ignore_trip_id=trip_id)

    if "vehicle_id" in updates and updates["vehicle_id"] != trip.vehicle_id:
        _get_vehicle_or_404(db, updates["vehicle_id"])
        _ensure_vehicle_available(db, updates["vehicle_id"], ignore_trip_id=trip_id)

    for field, value in updates.items():
        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)
    return trip


def delete_trip(db: Session, trip_id: int) -> None:
    trip = get_trip_or_404(db, trip_id)
    db.delete(trip)
    db.commit()
