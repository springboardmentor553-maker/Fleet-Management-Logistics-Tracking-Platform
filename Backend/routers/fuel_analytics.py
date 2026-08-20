from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.fuel_record import FuelRecord
from app.models.vehicle import Vehicle
from app.schemas.fuel_analytics import FuelAnalyticsResponse

router = APIRouter(
    prefix="/analytics",
    tags=["Fuel Analytics"]
)


@router.get("/fuel", response_model=FuelAnalyticsResponse)
def fuel_analytics(db: Session = Depends(get_db)):

    total_fuel = (
        db.query(func.sum(FuelRecord.fuel_quantity))
        .scalar() or 0
    )

    total_cost = (
        db.query(func.sum(FuelRecord.fuel_cost))
        .scalar() or 0
    )

    average_fuel = (
        db.query(func.avg(FuelRecord.fuel_quantity))
        .scalar() or 0
    )

    highest_vehicle = (
        db.query(
            Vehicle.vehicle_number,
            func.sum(FuelRecord.fuel_quantity).label("total")
        )
        .join(
            FuelRecord,
            Vehicle.id == FuelRecord.vehicle_id
        )
        .group_by(
            Vehicle.vehicle_number
        )
        .order_by(
            func.sum(FuelRecord.fuel_quantity).desc()
        )
        .first()
    )

    lowest_vehicle = (
        db.query(
            Vehicle.vehicle_number,
            func.sum(FuelRecord.fuel_quantity).label("total")
        )
        .join(
            FuelRecord,
            Vehicle.id == FuelRecord.vehicle_id
        )
        .group_by(
            Vehicle.vehicle_number
        )
        .order_by(
            func.sum(FuelRecord.fuel_quantity).asc()
        )
        .first()
    )

    fuel_records = db.query(FuelRecord).all()

    return FuelAnalyticsResponse(
        total_fuel_consumed=round(total_fuel, 2),
        total_fuel_cost=round(total_cost, 2),
        average_fuel_consumption=round(average_fuel, 2),
        highest_fuel_usage_vehicle=highest_vehicle.vehicle_number if highest_vehicle else "N/A",
        lowest_fuel_usage_vehicle=lowest_vehicle.vehicle_number if lowest_vehicle else "N/A",
        fuel_records=[
        {
            "vehicle_id": record.vehicle_id,
            "fuel_date": record.fuel_date,
            "fuel_amount": record.fuel_quantity,
            "fuel_cost": record.fuel_cost,
            "mileage": record.odometer_reading
        }
        for record in fuel_records
    ]
    )