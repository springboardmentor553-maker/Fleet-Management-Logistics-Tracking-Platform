from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common.enums import VehicleStatus
from app.common.exceptions import NotFoundError
from app.modules.fleet.models import Vehicle
from app.modules.maintenance.models import MaintenanceLog
from app.modules.maintenance.schemas import MaintenanceLogCreate, MaintenanceLogUpdate


def get_log_or_404(db: Session, log_id: int) -> MaintenanceLog:
    log = db.get(MaintenanceLog, log_id)
    if log is None:
        raise NotFoundError(f"Maintenance log {log_id} was not found")
    return log


def list_logs(db: Session, offset: int, limit: int, vehicle_id: int | None = None) -> tuple[list[MaintenanceLog], int]:
    query = select(MaintenanceLog)
    if vehicle_id is not None:
        query = query.where(MaintenanceLog.vehicle_id == vehicle_id)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(MaintenanceLog.performed_at.desc()).offset(offset).limit(limit)).all()
    return list(items), total


def create_log(db: Session, payload: MaintenanceLogCreate, put_vehicle_in_shop: bool = True) -> MaintenanceLog:
    vehicle = db.get(Vehicle, payload.vehicle_id)
    if vehicle is None:
        raise NotFoundError(f"Vehicle {payload.vehicle_id} was not found")

    log = MaintenanceLog(**payload.model_dump())
    db.add(log)

    if put_vehicle_in_shop:
        vehicle.status = VehicleStatus.IN_SHOP

    db.commit()
    db.refresh(log)
    return log


def update_log(db: Session, log_id: int, payload: MaintenanceLogUpdate) -> MaintenanceLog:
    log = get_log_or_404(db, log_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return log


def close_log(db: Session, log_id: int) -> MaintenanceLog:
    """Marks the related vehicle active again once the service is complete."""
    log = get_log_or_404(db, log_id)
    vehicle = db.get(Vehicle, log.vehicle_id)
    if vehicle is not None:
        vehicle.status = VehicleStatus.ACTIVE
    db.commit()
    db.refresh(log)
    return log
