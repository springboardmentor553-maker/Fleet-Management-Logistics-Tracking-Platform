from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common.enums import VehicleStatus
from app.common.exceptions import ConflictError, NotFoundError
from app.modules.fleet.models import Vehicle
from app.modules.fleet.schemas import VehicleCreate, VehicleUpdate


def get_vehicle_or_404(db: Session, vehicle_id: int) -> Vehicle:
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise NotFoundError(f"Vehicle {vehicle_id} was not found")
    return vehicle


def list_vehicles(
    db: Session, offset: int, limit: int, status_filter: VehicleStatus | None = None
) -> tuple[list[Vehicle], int]:
    query = select(Vehicle)
    if status_filter is not None:
        query = query.where(Vehicle.status == status_filter)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Vehicle.id).offset(offset).limit(limit)).all()
    return list(items), total


def create_vehicle(db: Session, payload: VehicleCreate) -> Vehicle:
    exists = db.scalar(select(Vehicle).where(Vehicle.plate_number == payload.plate_number))
    if exists is not None:
        raise ConflictError("A vehicle with this plate number already exists")
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def update_vehicle(db: Session, vehicle_id: int, payload: VehicleUpdate) -> Vehicle:
    vehicle = get_vehicle_or_404(db, vehicle_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(db: Session, vehicle_id: int) -> None:
    vehicle = get_vehicle_or_404(db, vehicle_id)
    db.delete(vehicle)
    db.commit()
