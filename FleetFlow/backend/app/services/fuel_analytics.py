from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.fuel_record import FuelRecord


def get_fuel_analytics(db: Session):

    total_fuel_consumed = (
        db.query(
            func.coalesce(
                func.sum(FuelRecord.fuel_quantity),
                0
            )
        )
        .scalar()
    )

    total_fuel_cost = (
        db.query(
            func.coalesce(
                func.sum(FuelRecord.fuel_cost),
                0
            )
        )
        .scalar()
    )

    average_fuel_consumption = (
        db.query(
            func.coalesce(
                func.avg(FuelRecord.fuel_quantity),
                0
            )
        )
        .scalar()
    )

    vehicle_usage = (
        db.query(
            FuelRecord.vehicle_id,
            func.sum(FuelRecord.fuel_quantity).label(
                "total_fuel"
            )
        )
        .group_by(FuelRecord.vehicle_id)
        .order_by(
            func.sum(FuelRecord.fuel_quantity).desc()
        )
        .all()
    )

    if vehicle_usage:
        highest_vehicle = vehicle_usage[0].vehicle_id
        lowest_vehicle = vehicle_usage[-1].vehicle_id
    else:
        highest_vehicle = None
        lowest_vehicle = None

    return {
        "total_fuel_consumed": float(total_fuel_consumed),
        "total_fuel_cost": float(total_fuel_cost),
        "average_fuel_consumption": float(
            average_fuel_consumption
        ),
        "vehicle_with_highest_fuel_usage": highest_vehicle,
        "vehicle_with_lowest_fuel_usage": lowest_vehicle
    }