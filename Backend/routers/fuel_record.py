from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.driver import Driver
from app.models.fuel_record import FuelRecord
from app.models.vehicle import Vehicle
from app.schemas.fuel_record import (
    FuelRecordCreate,
    FuelRecordResponse,
    FuelRecordUpdate,
)

router = APIRouter(
    prefix="/fuel-records",
    tags=["Fuel Monitoring"]
)


@router.post("/", response_model=FuelRecordResponse)
def add_fuel_record(
    fuel: FuelRecordCreate,
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == fuel.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    driver = db.query(Driver).filter(
        Driver.id == fuel.driver_id
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

    record = FuelRecord(**fuel.model_dump())

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get("/", response_model=list[FuelRecordResponse])
def get_all_fuel_records(
    db: Session = Depends(get_db)
):
    return db.query(FuelRecord).all()

@router.get("/analytics")
def fuel_analytics(
    db: Session = Depends(get_db)
):

    records = db.query(FuelRecord).all()

    total_fuel_consumed = sum(
        record.fuel_quantity 
        for record in records
    )

    total_fuel_cost = sum(
        record.fuel_cost 
        for record in records
    )


    vehicle_usage = (
        db.query(
            FuelRecord.vehicle_id,
            func.sum(FuelRecord.fuel_quantity).label("total")
        )
        .group_by(FuelRecord.vehicle_id)
        .all()
    )


    highest_vehicle = "-"
    lowest_vehicle = "-"


    if vehicle_usage:

        highest = max(
            vehicle_usage,
            key=lambda x: x.total
        )

        lowest = min(
            vehicle_usage,
            key=lambda x: x.total
        )


        highest_vehicle = f"Vehicle {highest.vehicle_id}"
        lowest_vehicle = f"Vehicle {lowest.vehicle_id}"


    return {

        "total_fuel_consumed": total_fuel_consumed,

        "total_fuel_cost": total_fuel_cost,

        "average_fuel_consumption": 0,

        "highest_fuel_usage_vehicle": highest_vehicle,

        "lowest_fuel_usage_vehicle": lowest_vehicle,


        "fuel_records": [

            {
                "vehicle_id": record.vehicle_id,
                "fuel_date": record.fuel_date,
                "fuel_amount": record.fuel_quantity,
                "fuel_cost": record.fuel_cost,
                "mileage": record.odometer_reading
            }

            for record in records

        ]

    }
@router.get("/{record_id}", response_model=FuelRecordResponse)
def get_fuel_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(FuelRecord).filter(
        FuelRecord.id == record_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    return record


@router.put("/{record_id}", response_model=FuelRecordResponse)
def update_fuel_record(
    record_id: int,
    fuel: FuelRecordUpdate,
    db: Session = Depends(get_db)
):
    record = db.query(FuelRecord).filter(
        FuelRecord.id == record_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    data = fuel.model_dump(exclude_unset=True)

    if "vehicle_id" in data:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == data["vehicle_id"]
        ).first()

        if not vehicle:
            raise HTTPException(
                status_code=404,
                detail="Vehicle not found"
            )

    if "driver_id" in data:
        driver = db.query(Driver).filter(
            Driver.id == data["driver_id"]
        ).first()

        if not driver:
            raise HTTPException(
                status_code=404,
                detail="Driver not found"
            )

    if "fuel_quantity" in data and data["fuel_quantity"] <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel quantity must be greater than zero"
        )

    if "fuel_cost" in data and data["fuel_cost"] <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel cost must be greater than zero"
        )

    for key, value in data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)

    return record


@router.delete("/{record_id}")
def delete_fuel_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(FuelRecord).filter(
        FuelRecord.id == record_id
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
