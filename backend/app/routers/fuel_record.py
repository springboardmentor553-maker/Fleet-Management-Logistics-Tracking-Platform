from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models.fuel_record import FuelRecord
from backend.app.models.vehicle import Vehicle
from backend.app.models.driver import Driver
from backend.app.schemas.fuel_record import (
    FuelRecordCreate,
    FuelRecordUpdate,
    FuelRecordResponse,
)
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/fuel-records",
    tags=["Fuel Records"],
)

WRITE_ROLES = ["Admin", "Fleet Manager"]
READ_ROLES = ["Admin", "Fleet Manager", "Dispatcher"]
DELETE_ROLES = ["Admin"]


def _get_vehicle_or_404(db: Session, vehicle_id: int) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


def _get_driver_or_404(db: Session, driver_id: int) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


# ── POST ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=FuelRecordResponse, status_code=status.HTTP_201_CREATED)
def create_fuel_record(
    payload: FuelRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(WRITE_ROLES)),
):
    """Create a new fuel record."""
    _get_vehicle_or_404(db, payload.vehicle_id)
    if payload.driver_id is not None:
        _get_driver_or_404(db, payload.driver_id)

    record = FuelRecord(
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        fuel_quantity=payload.fuel_quantity,
        fuel_cost=payload.fuel_cost,
        odometer_reading=payload.odometer_reading,
        fuel_date=payload.fuel_date,
        fuel_station=payload.fuel_station,
        remarks=payload.remarks,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── GET ALL ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[FuelRecordResponse])
def get_all_fuel_records(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(READ_ROLES)),
):
    """Return all fuel records."""
    return db.query(FuelRecord).all()


# ── GET ONE ───────────────────────────────────────────────────────────────────

@router.get("/{id}", response_model=FuelRecordResponse)
def get_fuel_record(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(READ_ROLES)),
):
    """Return a single fuel record by ID."""
    record = db.query(FuelRecord).filter(FuelRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel record not found")
    return record


# ── PUT ───────────────────────────────────────────────────────────────────────

@router.put("/{id}", response_model=FuelRecordResponse)
def update_fuel_record(
    id: int,
    payload: FuelRecordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(WRITE_ROLES)),
):
    """Update an existing fuel record."""
    record = db.query(FuelRecord).filter(FuelRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel record not found")

    if payload.vehicle_id is not None:
        _get_vehicle_or_404(db, payload.vehicle_id)
        record.vehicle_id = payload.vehicle_id

    if payload.driver_id is not None:
        _get_driver_or_404(db, payload.driver_id)
        record.driver_id = payload.driver_id

    if payload.fuel_quantity is not None:
        record.fuel_quantity = payload.fuel_quantity
    if payload.fuel_cost is not None:
        record.fuel_cost = payload.fuel_cost
    if payload.odometer_reading is not None:
        record.odometer_reading = payload.odometer_reading
    if payload.fuel_date is not None:
        record.fuel_date = payload.fuel_date
    if payload.fuel_station is not None:
        record.fuel_station = payload.fuel_station
    if payload.remarks is not None:
        record.remarks = payload.remarks

    db.commit()
    db.refresh(record)
    return record


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_fuel_record(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(DELETE_ROLES)),
):
    """Delete a fuel record."""
    record = db.query(FuelRecord).filter(FuelRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel record not found")

    db.delete(record)
    db.commit()
    return {"message": "Fuel record deleted successfully"}
