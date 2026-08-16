from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.fuel import FuelRecord
from app.schemas.fuel import (
    FuelRecordCreate,
    FuelRecordUpdate,
    FuelRecordResponse
)

router = APIRouter(
    prefix="/fuel",
    tags=["Fuel Monitoring"]
)


# =========================================================
# FUEL VALIDATION
# =========================================================

def validate_fuel_data(
    db: Session,
    vehicle_id: int,
    driver_id: int,
    quantity: float,
    cost: float
):
    # -----------------------------------------------------
    # 1. Validate vehicle exists
    # -----------------------------------------------------
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {vehicle_id} does not exist."
        )

    # -----------------------------------------------------
    # 2. Vehicle maintenance validation
    # -----------------------------------------------------
    if vehicle.current_status == "maintenance":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Vehicle is under maintenance and "
                "cannot receive fuel records."
            )
        )

    # -----------------------------------------------------
    # 3. Validate driver exists
    # -----------------------------------------------------
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver with ID {driver_id} does not exist."
        )

    # -----------------------------------------------------
    # 4. Validate fuel quantity
    # -----------------------------------------------------
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fuel quantity must be greater than zero."
        )

    # -----------------------------------------------------
    # 5. Validate fuel cost
    # -----------------------------------------------------
    if cost <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fuel cost must be greater than zero."
        )


# =========================================================
# CREATE FUEL RECORD
# =========================================================

@router.post(
    "/",
    response_model=FuelRecordResponse,
    status_code=status.HTTP_201_CREATED
)
def add_fuel_record(
    data: FuelRecordCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    # Validate vehicle, driver and fuel values
    validate_fuel_data(
        db,
        data.vehicle_id,
        data.driver_id,
        data.fuel_quantity,
        data.fuel_cost
    )

    # -----------------------------------------------------
    # DUPLICATE FUEL RECORD CHECK
    # -----------------------------------------------------

    existing_record = db.query(FuelRecord).filter(
        FuelRecord.vehicle_id == data.vehicle_id,
        FuelRecord.driver_id == data.driver_id,
        FuelRecord.fuel_quantity == data.fuel_quantity,
        FuelRecord.fuel_cost == data.fuel_cost,
        FuelRecord.odometer_reading == data.odometer_reading,
        FuelRecord.fuel_station == data.fuel_station
    ).first()

    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Duplicate fuel record. "
                "This fuel transaction already exists."
            )
        )

    # -----------------------------------------------------
    # CREATE NEW FUEL RECORD
    # -----------------------------------------------------

    record = FuelRecord(
        vehicle_id=data.vehicle_id,
        driver_id=data.driver_id,
        fuel_quantity=data.fuel_quantity,
        fuel_cost=data.fuel_cost,
        odometer_reading=data.odometer_reading,
        fuel_date=data.fuel_date,
        fuel_station=data.fuel_station,
        remarks=data.remarks,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


# =========================================================
# GET ALL FUEL RECORDS
# =========================================================

@router.get(
    "/",
    response_model=List[FuelRecordResponse]
)
def view_all_fuel_records(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return (
        db.query(FuelRecord)
        .order_by(FuelRecord.id.desc())
        .all()
    )


# =========================================================
# GET FUEL RECORD BY ID
# =========================================================

@router.get(
    "/{id}",
    response_model=FuelRecordResponse
)
def get_fuel_record_by_id(
    id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    record = db.query(FuelRecord).filter(
        FuelRecord.id == id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel record not found."
        )

    return record


# =========================================================
# UPDATE FUEL RECORD
# =========================================================

@router.put(
    "/{id}",
    response_model=FuelRecordResponse
)
def update_fuel_record(
    id: int,
    data: FuelRecordUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    # -----------------------------------------------------
    # Find existing record
    # -----------------------------------------------------

    record = db.query(FuelRecord).filter(
        FuelRecord.id == id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel record not found."
        )

    # -----------------------------------------------------
    # Use existing values when fields aren't updated
    # -----------------------------------------------------

    v_id = (
        data.vehicle_id
        if data.vehicle_id is not None
        else record.vehicle_id
    )

    d_id = (
        data.driver_id
        if data.driver_id is not None
        else record.driver_id
    )

    qty = (
        data.fuel_quantity
        if data.fuel_quantity is not None
        else record.fuel_quantity
    )

    cst = (
        data.fuel_cost
        if data.fuel_cost is not None
        else record.fuel_cost
    )

    # -----------------------------------------------------
    # Validate updated data
    # -----------------------------------------------------

    validate_fuel_data(
        db,
        v_id,
        d_id,
        qty,
        cst
    )

    # -----------------------------------------------------
    # Get remaining values for duplicate check
    # -----------------------------------------------------

    odometer = (
        data.odometer_reading
        if data.odometer_reading is not None
        else record.odometer_reading
    )

    station = (
        data.fuel_station
        if data.fuel_station is not None
        else record.fuel_station
    )

    # -----------------------------------------------------
    # DUPLICATE CHECK DURING UPDATE
    # -----------------------------------------------------

    duplicate_record = db.query(FuelRecord).filter(
        FuelRecord.vehicle_id == v_id,
        FuelRecord.driver_id == d_id,
        FuelRecord.fuel_quantity == qty,
        FuelRecord.fuel_cost == cst,
        FuelRecord.odometer_reading == odometer,
        FuelRecord.fuel_station == station,
        FuelRecord.id != id
    ).first()

    if duplicate_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Duplicate fuel record. "
                "Another fuel transaction with the same "
                "details already exists."
            )
        )

    # -----------------------------------------------------
    # UPDATE FIELDS
    # -----------------------------------------------------

    if data.vehicle_id is not None:
        record.vehicle_id = data.vehicle_id

    if data.driver_id is not None:
        record.driver_id = data.driver_id

    if data.fuel_quantity is not None:
        record.fuel_quantity = data.fuel_quantity

    if data.fuel_cost is not None:
        record.fuel_cost = data.fuel_cost

    if data.odometer_reading is not None:
        record.odometer_reading = data.odometer_reading

    if data.fuel_station is not None:
        record.fuel_station = data.fuel_station

    if data.remarks is not None:
        record.remarks = data.remarks

    if data.fuel_date is not None:
        record.fuel_date = data.fuel_date

    # -----------------------------------------------------
    # SAVE UPDATE
    # -----------------------------------------------------

    db.commit()
    db.refresh(record)

    return record


# =========================================================
# DELETE FUEL RECORD
# =========================================================

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_fuel_record(
    id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    # -----------------------------------------------------
    # Find record
    # -----------------------------------------------------

    record = db.query(FuelRecord).filter(
        FuelRecord.id == id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel record not found."
        )

    # -----------------------------------------------------
    # Delete record
    # -----------------------------------------------------

    db.delete(record)
    db.commit()

    return None