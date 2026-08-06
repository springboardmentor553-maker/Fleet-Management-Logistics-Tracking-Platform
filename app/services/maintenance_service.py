from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate

from app.services.notification_service import create_notification


# =====================================
# Create Maintenance Record
# =====================================

def create_maintenance(maintenance: MaintenanceCreate, db: Session):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == maintenance.vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    new_record = Maintenance(**maintenance.model_dump())

    db.add(new_record)

    # Task 5 — Update Vehicle Status
    if maintenance.maintenance_status.lower() == "in progress":
        vehicle.status = "Under Maintenance"

    create_notification(
        db=db,
        title="Maintenance Scheduled",
        message=f"Maintenance ({maintenance.maintenance_category}) scheduled for vehicle '{vehicle.vehicle_number}'.",
        type="info"
    )

    db.commit()
    db.refresh(new_record)

    return new_record


# =====================================
# Get All Maintenance Records
# =====================================

def get_all_maintenance(db: Session):
    return db.query(Maintenance).all()


# =====================================
# Get Single Maintenance Record
# =====================================

def get_maintenance(maintenance_id: int, db: Session):

    record = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    return record


# =====================================
# Update Maintenance Record
# =====================================

def update_maintenance(
    maintenance_id: int,
    maintenance: MaintenanceUpdate,
    db: Session
):

    db_record = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if not db_record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == db_record.vehicle_id)
        .first()
    )

    for key, value in maintenance.model_dump().items():
        setattr(db_record, key, value)

    # Task 5 — Update Vehicle Status based on maintenance status
    if vehicle:
        if maintenance.maintenance_status.lower() == "in progress":
            vehicle.status = "Under Maintenance"
        elif maintenance.maintenance_status.lower() == "completed":
            vehicle.status = "Available"

    create_notification(
        db=db,
        title="Maintenance Updated",
        message=f"Maintenance record #{maintenance_id} has been updated to '{maintenance.maintenance_status}'.",
        type="info"
    )

    db.commit()
    db.refresh(db_record)

    return db_record


# =====================================
# Delete Maintenance Record
# =====================================
# Maintenance history must never be deleted, so this
# endpoint intentionally refuses to remove records.

def delete_maintenance(maintenance_id: int, db: Session):

    record = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    raise HTTPException(
        status_code=400,
        detail="Maintenance records cannot be deleted. Service history must be preserved."
    )