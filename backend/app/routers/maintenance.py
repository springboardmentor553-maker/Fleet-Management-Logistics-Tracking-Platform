from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance import Maintenance
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate
)

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)


# Create Maintenance
@router.post("/")
def create_maintenance(
    maintenance: MaintenanceCreate,
    db: Session = Depends(get_db)
):
    new_maintenance = Maintenance(
        vehicle_id=maintenance.vehicle_id,
        maintenance_type=maintenance.maintenance_type,
        scheduled_date=maintenance.scheduled_date,
        remarks=maintenance.remarks
    )

    db.add(new_maintenance)
    db.commit()
    db.refresh(new_maintenance)

    return {
        "message": "Maintenance scheduled successfully",
        "maintenance": new_maintenance
    }


# Get All Maintenance Records
@router.get("/")
def get_maintenance(db: Session = Depends(get_db)):
    return db.query(Maintenance).all()


# Get Maintenance by ID
@router.get("/{maintenance_id}")
def get_maintenance_by_id(
    maintenance_id: int,
    db: Session = Depends(get_db)
):
    maintenance = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if not maintenance:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    return maintenance


# Update Maintenance
@router.put("/{maintenance_id}")
def update_maintenance(
    maintenance_id: int,
    updated_data: MaintenanceUpdate,
    db: Session = Depends(get_db)
):
    maintenance = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if not maintenance:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    data = updated_data.model_dump(exclude_unset=True)

    for key, value in data.items():
        setattr(maintenance, key, value)

    db.commit()
    db.refresh(maintenance)

    return {
        "message": "Maintenance updated successfully",
        "maintenance": maintenance
    }


# Delete Maintenance
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

    if not maintenance:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    db.delete(maintenance)
    db.commit()

    return {
        "message": "Maintenance record deleted successfully"
    }