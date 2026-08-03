from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Maintenance, Vehicle
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
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


# Create Maintenance
@router.post("/", response_model=MaintenanceResponse)
def create_maintenance(
    maintenance: MaintenanceCreate,
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == maintenance.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle ID does not exist"
        )

    # Update Vehicle Status
    vehicle.status = "Under Maintenance"

    new_record = Maintenance(**maintenance.dict())

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


# Get All Maintenance
@router.get("/")
def get_all_maintenance(db: Session = Depends(get_db)):
    return db.query(Maintenance).all()


# Get Maintenance By ID
@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_maintenance(
    maintenance_id: int,
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


# Update Maintenance
@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance(
    maintenance_id: int,
    maintenance: MaintenanceUpdate,
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

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == maintenance.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle ID does not exist"
        )

    for key, value in maintenance.dict().items():
        setattr(record, key, value)

    if maintenance.maintenance_status == "Completed":
        vehicle.status = "Available"
    else:
        vehicle.status = "Under Maintenance"

    db.commit()
    db.refresh(record)
    db.refresh(vehicle)
    

    return record


# Delete Maintenance
@router.delete("/{maintenance_id}")
def delete_maintenance(
    maintenance_id: int,
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

    db.delete(record)
    db.commit()

    return {
        "message": "Maintenance record deleted successfully"
    }