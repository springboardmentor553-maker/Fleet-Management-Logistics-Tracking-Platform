from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Maintenance, Vehicle
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
)
from app.dependencies import (
    fleet_manager_required,
    driver_view_required
)

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================================================
# CREATE MAINTENANCE
# Administrator / Fleet Manager
# =========================================================

@router.post(
    "/",
    response_model=MaintenanceResponse
)
def create_maintenance(
    maintenance: MaintenanceCreate,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    # Check vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == maintenance.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle ID does not exist"
        )

    # Check duplicate maintenance
    duplicate = db.query(Maintenance).filter(
        Maintenance.vehicle_id == maintenance.vehicle_id,
        Maintenance.maintenance_category ==
            maintenance.maintenance_category,
        Maintenance.service_date ==
            maintenance.service_date
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="Duplicate maintenance record already exists"
        )

    # Update vehicle status
    vehicle.status = "Under Maintenance"

    # Create maintenance
    new_record = Maintenance(
        **maintenance.dict()
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


# =========================================================
# GET ALL MAINTENANCE
# Administrator / Fleet Manager / Dispatcher / Driver
# =========================================================

@router.get(
    "/",
    response_model=list[MaintenanceResponse]
)
def get_all_maintenance(
    user=Depends(driver_view_required),
    db: Session = Depends(get_db)
):

    return db.query(Maintenance).all()


# =========================================================
# GET MAINTENANCE BY ID
# Administrator / Fleet Manager / Dispatcher / Driver
# =========================================================

@router.get(
    "/{maintenance_id}",
    response_model=MaintenanceResponse
)
def get_maintenance(
    maintenance_id: int,
    user=Depends(driver_view_required),
    db: Session = Depends(get_db)
):

    record = db.query(Maintenance).filter(
        Maintenance.maintenance_id == maintenance_id
    ).first()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    return record


# =========================================================
# UPDATE MAINTENANCE
# Administrator / Fleet Manager
# =========================================================

@router.put(
    "/{maintenance_id}",
    response_model=MaintenanceResponse
)
def update_maintenance(
    maintenance_id: int,
    maintenance: MaintenanceUpdate,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    record = db.query(Maintenance).filter(
        Maintenance.maintenance_id == maintenance_id
    ).first()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    # Check vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == maintenance.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle ID does not exist"
        )

    # Update fields
    for key, value in maintenance.dict().items():
        setattr(record, key, value)

    # Update vehicle status
    if maintenance.maintenance_status == "Completed":
        vehicle.status = "Available"
    else:
        vehicle.status = "Under Maintenance"

    db.commit()
    db.refresh(record)
    db.refresh(vehicle)

    return record


# =========================================================
# DELETE MAINTENANCE
# Administrator / Fleet Manager
# =========================================================

@router.delete("/{maintenance_id}")
def delete_maintenance(
    maintenance_id: int,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    record = db.query(Maintenance).filter(
        Maintenance.maintenance_id == maintenance_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    # Make vehicle available when maintenance is deleted
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == record.vehicle_id
    ).first()

    if vehicle:
        vehicle.status = "Available"

    db.delete(record)
    db.commit()

    return {
        "message": "Maintenance record deleted successfully"
    }