from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common.enums import DriverStatus, ShipmentStatus, VehicleStatus
from app.common.exceptions import ConflictError, NotFoundError
from app.modules.drivers.models import Driver
from app.modules.fleet.models import Vehicle
from app.modules.shipments.models import Shipment
from app.modules.shipments.schemas import ShipmentAssign, ShipmentCreate, ShipmentUpdate


def get_shipment_or_404(db: Session, shipment_id: int) -> Shipment:
    shipment = db.get(Shipment, shipment_id)
    if shipment is None:
        raise NotFoundError(f"Shipment {shipment_id} was not found")
    return shipment


def list_shipments(
    db: Session, offset: int, limit: int, status_filter: ShipmentStatus | None = None
) -> tuple[list[Shipment], int]:
    query = select(Shipment)
    if status_filter is not None:
        query = query.where(Shipment.status == status_filter)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Shipment.id.desc()).offset(offset).limit(limit)).all()
    return list(items), total


def create_shipment(db: Session, payload: ShipmentCreate) -> Shipment:
    exists = db.scalar(select(Shipment).where(Shipment.reference_code == payload.reference_code))
    if exists is not None:
        raise ConflictError("A shipment with this reference code already exists")
    shipment = Shipment(**payload.model_dump())
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment


def update_shipment(db: Session, shipment_id: int, payload: ShipmentUpdate) -> Shipment:
    shipment = get_shipment_or_404(db, shipment_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(shipment, field, value)
    db.commit()
    db.refresh(shipment)
    return shipment


def assign_shipment(db: Session, shipment_id: int, payload: ShipmentAssign) -> Shipment:
    shipment = get_shipment_or_404(db, shipment_id)
    if shipment.status not in (ShipmentStatus.PENDING,):
        raise ConflictError("Only pending shipments can be assigned")

    vehicle = db.get(Vehicle, payload.vehicle_id)
    if vehicle is None or vehicle.status != VehicleStatus.ACTIVE:
        raise ConflictError("Selected vehicle is not available for assignment")

    driver = db.get(Driver, payload.driver_id)
    if driver is None or driver.status != DriverStatus.AVAILABLE:
        raise ConflictError("Selected driver is not available for assignment")

    shipment.vehicle_id = vehicle.id
    shipment.driver_id = driver.id
    shipment.status = ShipmentStatus.ASSIGNED
    driver.status = DriverStatus.ON_TRIP

    db.commit()
    db.refresh(shipment)
    return shipment


def mark_in_transit(db: Session, shipment_id: int) -> Shipment:
    shipment = get_shipment_or_404(db, shipment_id)
    if shipment.status != ShipmentStatus.ASSIGNED:
        raise ConflictError("Only assigned shipments can move to in-transit")
    shipment.status = ShipmentStatus.IN_TRANSIT
    db.commit()
    db.refresh(shipment)
    return shipment


def mark_delivered(db: Session, shipment_id: int) -> Shipment:
    shipment = get_shipment_or_404(db, shipment_id)
    if shipment.status != ShipmentStatus.IN_TRANSIT:
        raise ConflictError("Only in-transit shipments can be marked delivered")
    shipment.status = ShipmentStatus.DELIVERED
    shipment.delivered_at = datetime.now(timezone.utc)
    if shipment.driver_id is not None:
        driver = db.get(Driver, shipment.driver_id)
        if driver is not None:
            driver.status = DriverStatus.AVAILABLE
    db.commit()
    db.refresh(shipment)
    return shipment


def cancel_shipment(db: Session, shipment_id: int) -> Shipment:
    shipment = get_shipment_or_404(db, shipment_id)
    if shipment.status in (ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED):
        raise ConflictError("This shipment can no longer be cancelled")
    if shipment.driver_id is not None:
        driver = db.get(Driver, shipment.driver_id)
        if driver is not None:
            driver.status = DriverStatus.AVAILABLE
    shipment.status = ShipmentStatus.CANCELLED
    db.commit()
    db.refresh(shipment)
    return shipment
