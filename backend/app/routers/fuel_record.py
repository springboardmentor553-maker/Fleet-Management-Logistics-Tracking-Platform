from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import FuelRecord, Vehicle
from app.database import get_db
from app.models import FuelRecord, Vehicle, Driver
from app.schemas.fuel_record import FuelRecordCreate, FuelRecordResponse

router = APIRouter(
    prefix="/fuel-records",
    tags=["Fuel Monitoring"]
)

# Add Fuel Record
@router.post("/", response_model=FuelRecordResponse)
def add_fuel_record(fuel: FuelRecordCreate, db: Session = Depends(get_db)):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == fuel.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    driver = db.query(Driver).filter(
        Driver.driver_id == fuel.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if fuel.fuel_quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel quantity must be greater than zero"
        )

    if fuel.fuel_cost <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel cost must be greater than zero"
        )

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
    db.commit()
    db.refresh(new_record)

    return new_record


# View All Fuel Records
@router.get("/", response_model=list[FuelRecordResponse])
def get_all_fuel_records(db: Session = Depends(get_db)):
    return db.query(FuelRecord).all()


# Get Fuel Record by ID
@router.get("/{fuel_record_id}", response_model=FuelRecordResponse)
def get_fuel_record(
    fuel_record_id: int,
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


# Update Fuel Record
@router.put("/{fuel_record_id}", response_model=FuelRecordResponse)
def update_fuel_record(
    fuel_record_id: int,
    fuel: FuelRecordCreate,
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

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == fuel.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    driver = db.query(Driver).filter(
        Driver.driver_id == fuel.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if fuel.fuel_quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel quantity must be greater than zero"
        )

    if fuel.fuel_cost <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel cost must be greater than zero"
        )

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


# Delete Fuel Record
@router.delete("/{fuel_record_id}")
def delete_fuel_record(
    fuel_record_id: int,
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

    return {"message": "Fuel record deleted successfully"}

@router.get("/analytics/fuel")
def fuel_analytics(db: Session = Depends(get_db)):

    # Total Fuel Consumed
    total_fuel = db.query(
        func.sum(FuelRecord.fuel_quantity)
    ).scalar() or 0

    # Total Fuel Cost
    total_cost = db.query(
        func.sum(FuelRecord.fuel_cost)
    ).scalar() or 0

    # Average Fuel Consumption
    average_fuel = db.query(
        func.avg(FuelRecord.fuel_quantity)
    ).scalar() or 0

    # Vehicle with Highest Fuel Usage
    highest = (
        db.query(
            FuelRecord.vehicle_id,
            func.sum(FuelRecord.fuel_quantity).label("total")
        )
        .group_by(FuelRecord.vehicle_id)
        .order_by(func.sum(FuelRecord.fuel_quantity).desc())
        .first()
    )

    # Vehicle with Lowest Fuel Usage
    lowest = (
        db.query(
            FuelRecord.vehicle_id,
            func.sum(FuelRecord.fuel_quantity).label("total")
        )
        .group_by(FuelRecord.vehicle_id)
        .order_by(func.sum(FuelRecord.fuel_quantity).asc())
        .first()
    )

    highest_vehicle = None
    lowest_vehicle = None

    if highest:
        vehicle = db.query(Vehicle).filter(
            Vehicle.vehicle_id == highest.vehicle_id
        ).first()

        highest_vehicle = {
            "vehicle_id": highest.vehicle_id,
            "vehicle_number": vehicle.vehicle_number if vehicle else None,
            "fuel_used": highest.total
        }

    if lowest:
        vehicle = db.query(Vehicle).filter(
            Vehicle.vehicle_id == lowest.vehicle_id
        ).first()

        lowest_vehicle = {
            "vehicle_id": lowest.vehicle_id,
            "vehicle_number": vehicle.vehicle_number if vehicle else None,
            "fuel_used": lowest.total
        }

    return {
        "total_fuel_consumed": total_fuel,
        "total_fuel_cost": total_cost,
        "average_fuel_consumption": average_fuel,
        "vehicle_with_highest_fuel_usage": highest_vehicle,
        "vehicle_with_lowest_fuel_usage": lowest_vehicle
    }