from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import FuelRecord, Vehicle, Driver

from app.schemas.fuel_record import (
    FuelRecordCreate,
    FuelRecordResponse
)

from app.dependencies import (
    fuel_management_required,
    fuel_view_required
)


router = APIRouter(
    prefix="/fuel-records",
    tags=["Fuel Monitoring"]
)


# ============================================================
# ADD FUEL RECORD
# Administrator / Fleet Manager
# ============================================================

@router.post(
    "/",
    response_model=FuelRecordResponse
)
def add_fuel_record(
    fuel: FuelRecordCreate,
    user=Depends(fuel_management_required),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Validate Vehicle
    # --------------------------------------------------------

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == fuel.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # --------------------------------------------------------
    # Validate Driver
    # --------------------------------------------------------

    driver = db.query(Driver).filter(
        Driver.driver_id == fuel.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # --------------------------------------------------------
    # Validate Fuel Quantity
    # --------------------------------------------------------

    if fuel.fuel_quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel quantity must be greater than zero"
        )

    # --------------------------------------------------------
    # Validate Fuel Cost
    # --------------------------------------------------------

    if fuel.fuel_cost <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel cost must be greater than zero"
        )

    # --------------------------------------------------------
    # Create Fuel Record
    # --------------------------------------------------------

    new_record = FuelRecord(
        vehicle_id=fuel.vehicle_id,
        driver_id=fuel.driver_id,
        fuel_quantity=fuel.fuel_quantity,
        fuel_cost=fuel.fuel_cost,
        odometer_reading=fuel.odometer_reading,
        fuel_date=fuel.fuel_date,
        fuel_station=fuel.fuel_station,
        remarks=fuel.remarks
    )

    db.add(new_record)

    # --------------------------------------------------------
    # Update Vehicle Fuel Level
    # --------------------------------------------------------

    new_fuel_level = vehicle.fuel_level + fuel.fuel_quantity

    if new_fuel_level > 100:
        new_fuel_level = 100

    vehicle.fuel_level = new_fuel_level

    if vehicle.fuel_level < 20:
        vehicle.fuel_status = "low"
    else:
        vehicle.fuel_status = "good"

    db.commit()
    db.refresh(new_record)
    db.refresh(vehicle)

    return new_record


# ============================================================
# GET ALL FUEL RECORDS
# Administrator / Fleet Manager / Dispatcher / Driver
# ============================================================

@router.get(
    "/",
    response_model=list[FuelRecordResponse]
)
def get_all_fuel_records(
    user=Depends(fuel_view_required),
    db: Session = Depends(get_db)
):

    return db.query(FuelRecord).all()


# ============================================================
# FUEL ANALYTICS
# Administrator / Fleet Manager / Dispatcher / Driver
# ============================================================
# IMPORTANT:
# Keep this BEFORE /{fuel_record_id}
# ============================================================

@router.get("/analytics/fuel")
def fuel_analytics(
    user=Depends(fuel_view_required),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Total Fuel Consumed
    # --------------------------------------------------------

    total_fuel = db.query(
        func.sum(FuelRecord.fuel_quantity)
    ).scalar() or 0

    # --------------------------------------------------------
    # Total Fuel Cost
    # --------------------------------------------------------

    total_cost = db.query(
        func.sum(FuelRecord.fuel_cost)
    ).scalar() or 0

    # --------------------------------------------------------
    # Average Fuel Consumption
    # --------------------------------------------------------

    average_fuel = db.query(
        func.avg(FuelRecord.fuel_quantity)
    ).scalar() or 0

    # --------------------------------------------------------
    # Vehicle With Highest Fuel Usage
    # --------------------------------------------------------

    highest = (
        db.query(
            FuelRecord.vehicle_id,
            func.sum(
                FuelRecord.fuel_quantity
            ).label("total")
        )
        .group_by(FuelRecord.vehicle_id)
        .order_by(
            func.sum(
                FuelRecord.fuel_quantity
            ).desc()
        )
        .first()
    )

    # --------------------------------------------------------
    # Vehicle With Lowest Fuel Usage
    # --------------------------------------------------------

    lowest = (
        db.query(
            FuelRecord.vehicle_id,
            func.sum(
                FuelRecord.fuel_quantity
            ).label("total")
        )
        .group_by(FuelRecord.vehicle_id)
        .order_by(
            func.sum(
                FuelRecord.fuel_quantity
            ).asc()
        )
        .first()
    )

    highest_vehicle = None
    lowest_vehicle = None

    # --------------------------------------------------------
    # Highest Usage Vehicle Details
    # --------------------------------------------------------

    if highest:

        vehicle = db.query(Vehicle).filter(
            Vehicle.vehicle_id == highest.vehicle_id
        ).first()

        highest_vehicle = {
            "vehicle_id": highest.vehicle_id,
            "vehicle_number": (
                vehicle.vehicle_number
                if vehicle
                else None
            ),
            "fuel_used": highest.total
        }

    # --------------------------------------------------------
    # Lowest Usage Vehicle Details
    # --------------------------------------------------------

    if lowest:

        vehicle = db.query(Vehicle).filter(
            Vehicle.vehicle_id == lowest.vehicle_id
        ).first()

        lowest_vehicle = {
            "vehicle_id": lowest.vehicle_id,
            "vehicle_number": (
                vehicle.vehicle_number
                if vehicle
                else None
            ),
            "fuel_used": lowest.total
        }

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "total_fuel_consumed": total_fuel,
        "total_fuel_cost": total_cost,
        "average_fuel_consumption": average_fuel,
        "vehicle_with_highest_fuel_usage": highest_vehicle,
        "vehicle_with_lowest_fuel_usage": lowest_vehicle
    }


# ============================================================
# GET FUEL RECORD BY ID
# Administrator / Fleet Manager / Dispatcher / Driver
# ============================================================

@router.get(
    "/{fuel_record_id}",
    response_model=FuelRecordResponse
)
def get_fuel_record(
    fuel_record_id: int,
    user=Depends(fuel_view_required),
    db: Session = Depends(get_db)
):

    record = db.query(FuelRecord).filter(
        FuelRecord.fuel_record_id == fuel_record_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    return record


# ============================================================
# UPDATE FUEL RECORD
# Administrator / Fleet Manager
# ============================================================

@router.put(
    "/{fuel_record_id}",
    response_model=FuelRecordResponse
)
def update_fuel_record(
    fuel_record_id: int,
    fuel: FuelRecordCreate,
    user=Depends(fuel_management_required),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Find Existing Record
    # --------------------------------------------------------

    record = db.query(FuelRecord).filter(
        FuelRecord.fuel_record_id == fuel_record_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    # --------------------------------------------------------
    # Validate Vehicle
    # --------------------------------------------------------

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == fuel.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # --------------------------------------------------------
    # Validate Driver
    # --------------------------------------------------------

    driver = db.query(Driver).filter(
        Driver.driver_id == fuel.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # --------------------------------------------------------
    # Validate Fuel Quantity
    # --------------------------------------------------------

    if fuel.fuel_quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel quantity must be greater than zero"
        )

    # --------------------------------------------------------
    # Validate Fuel Cost
    # --------------------------------------------------------

    if fuel.fuel_cost <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel cost must be greater than zero"
        )

    # --------------------------------------------------------
    # Update Record
    # --------------------------------------------------------

    record.vehicle_id = fuel.vehicle_id
    record.driver_id = fuel.driver_id
    record.fuel_quantity = fuel.fuel_quantity
    record.fuel_cost = fuel.fuel_cost
    record.odometer_reading = fuel.odometer_reading
    record.fuel_date = fuel.fuel_date
    record.fuel_station = fuel.fuel_station
    record.remarks = fuel.remarks

    db.commit()
    db.refresh(record)

    return record


# ============================================================
# DELETE FUEL RECORD
# Administrator / Fleet Manager
# ============================================================

@router.delete("/{fuel_record_id}")
def delete_fuel_record(
    fuel_record_id: int,
    user=Depends(fuel_management_required),
    db: Session = Depends(get_db)
):

    record = db.query(FuelRecord).filter(
        FuelRecord.fuel_record_id == fuel_record_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    db.delete(record)
    db.commit()

    return {
        "message": "Fuel record deleted successfully"
    }