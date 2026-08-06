from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import (
    get_db,
    require_role,
)

from app.models.fuel_record import FuelRecord
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.user import User

from app.schemas.fuel_record import (
    FuelRecordCreate,
    FuelRecordUpdate,
    FuelRecordResponse,
)

from app.schemas.common import MessageResponse

router = APIRouter()


# -----------------------------
# Add Fuel Record
# -----------------------------
@router.post("/", response_model=FuelRecordResponse)
def add_fuel_record(
    fuel: FuelRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager"
        )
    ),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == fuel.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    driver = db.query(Driver).filter(
        Driver.id == fuel.driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found."
        )

    new_record = FuelRecord(
        vehicle_id=fuel.vehicle_id,
        driver_id=fuel.driver_id,
        fuel_quantity=fuel.fuel_quantity,
        fuel_cost=fuel.fuel_cost,
        odometer_reading=fuel.odometer_reading,
        fuel_date=fuel.fuel_date,
        fuel_station=fuel.fuel_station,
        remarks=fuel.remarks,
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


# -----------------------------
# View All Fuel Records
# -----------------------------
@router.get("/", response_model=list[FuelRecordResponse])
def get_all_fuel_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher"
        )
    ),
):
    return db.query(FuelRecord).all()


# -----------------------------
# Get Fuel Record by ID
# -----------------------------
@router.get("/{fuel_record_id}", response_model=FuelRecordResponse)
def get_fuel_record(
    fuel_record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher"
        )
    ),
):
    record = db.query(FuelRecord).filter(
        FuelRecord.id == fuel_record_id
    ).first()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found."
        )

    return record


# -----------------------------
# Update Fuel Record
# -----------------------------
@router.put("/{fuel_record_id}", response_model=FuelRecordResponse)
def update_fuel_record(
    fuel_record_id: int,
    fuel: FuelRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager"
        )
    ),
):
    record = db.query(FuelRecord).filter(
        FuelRecord.id == fuel_record_id
    ).first()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found."
        )

    update_data = fuel.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)

    return record


# -----------------------------
# Delete Fuel Record
# -----------------------------
@router.delete(
    "/{fuel_record_id}",
    response_model=MessageResponse
)
def delete_fuel_record(
    fuel_record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    record = db.query(FuelRecord).filter(
        FuelRecord.id == fuel_record_id
    ).first()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found."
        )

    db.delete(record)
    db.commit()

    return {
        "message": "Fuel record deleted successfully."
    }