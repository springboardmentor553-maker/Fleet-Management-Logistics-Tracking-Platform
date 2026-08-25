from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role

router = APIRouter(prefix="/fuel", tags=["Fuel Monitoring"])


def validate_fuel_record(record, db: Session):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == record.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    driver = db.query(models.Driver).filter(models.Driver.id == record.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    if record.fuel_quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fuel quantity must be greater than zero")

    if record.fuel_cost <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fuel cost must be greater than zero")


@router.post("/", response_model=schemas.FuelRecordResponse)
def add_fuel_record(
    record: schemas.FuelRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "fleet_manager")),
):
    validate_fuel_record(record, db)

    new_record = models.FuelRecord(**record.dict())
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.get("/", response_model=list[schemas.FuelRecordResponse])
def list_fuel_records(vehicle_id: Optional[int] = None, driver_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.FuelRecord)
    if vehicle_id is not None:
        query = query.filter(models.FuelRecord.vehicle_id == vehicle_id)
    if driver_id is not None:
        query = query.filter(models.FuelRecord.driver_id == driver_id)
    return query.order_by(models.FuelRecord.fuel_date.desc()).all()


@router.get("/{fuel_id}", response_model=schemas.FuelRecordResponse)
def get_fuel_record(fuel_id: int, db: Session = Depends(get_db)):
    record = db.query(models.FuelRecord).filter(models.FuelRecord.id == fuel_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel record not found")
    return record


@router.put("/{fuel_id}", response_model=schemas.FuelRecordResponse)
def update_fuel_record(
    fuel_id: int,
    updated: schemas.FuelRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "fleet_manager")),
):
    record = db.query(models.FuelRecord).filter(models.FuelRecord.id == fuel_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel record not found")

    validate_fuel_record(updated, db)

    for key, value in updated.dict().items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{fuel_id}")
def delete_fuel_record(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "fleet_manager")),
):
    record = db.query(models.FuelRecord).filter(models.FuelRecord.id == fuel_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel record not found")

    db.delete(record)
    db.commit()
    return {"message": "Fuel record deleted successfully"}