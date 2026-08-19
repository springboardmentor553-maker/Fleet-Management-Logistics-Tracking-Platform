from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceResponse,
    MaintenanceUpdate,
)

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)


# Create Maintenance Record
@router.post("/", response_model=MaintenanceResponse)
def add_maintenance(
    maintenance: MaintenanceCreate,
    db: Session = Depends(get_db)
):
    # Check if vehicle exists
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == maintenance.vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Update vehicle status based on maintenance status
    if maintenance.maintenance_status in ["Scheduled", "In Progress"]:
        vehicle.status = "Maintenance"
    elif maintenance.maintenance_status in ["Completed", "Cancelled"]:
        vehicle.status = "Available"

    # Create maintenance record
    db_maintenance = Maintenance(
        **maintenance.model_dump()
    )

    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)

    return db_maintenance

# Get All Maintenance Records
@router.get("/", response_model=list[MaintenanceResponse])
def get_maintenance_records(
    db: Session = Depends(get_db)
):
    return db.query(Maintenance).all()


# Get Maintenance Record By ID
@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_maintenance_record(
    maintenance_id: int,
    db: Session = Depends(get_db)
):
    maintenance = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    return maintenance


# Update Maintenance Record
@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance(
    maintenance_id: int,
    updated_maintenance: MaintenanceUpdate,
    db: Session = Depends(get_db)
):
    # Check if maintenance record exists
    maintenance = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    # If vehicle_id is updated, validate it
    if updated_maintenance.vehicle_id is not None:
        vehicle = (
            db.query(Vehicle)
            .filter(Vehicle.id == updated_maintenance.vehicle_id)
            .first()
        )

        if vehicle is None:
            raise HTTPException(
                status_code=404,
                detail="Vehicle not found"
            )

    # Update only the provided fields
    update_data = updated_maintenance.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(maintenance, key, value)

    # Get the linked vehicle
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == maintenance.vehicle_id)
        .first()
    )

    # Update vehicle status based on maintenance status
    if maintenance.maintenance_status in ["Scheduled", "In Progress"]:
        vehicle.status = "Maintenance"
    elif maintenance.maintenance_status in ["Completed", "Cancelled"]:
        vehicle.status = "Available"

    db.commit()
    db.refresh(maintenance)

    return maintenance

# Delete Maintenance Record
@router.delete("/{maintenance_id}")
def delete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db)
):
    maintenance = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    db.delete(maintenance)
    db.commit()

    return {
        "message": "Maintenance record deleted successfully"
    }