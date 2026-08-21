from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.fuel import Fuel

router = APIRouter(
    prefix="/fuel-analytics",
    tags=["Fuel Analytics"]
)


@router.get("/")
def fuel_analytics(db: Session = Depends(get_db)):

    total_records = db.query(Fuel).count()

    total_fuel_consumed = db.query(
        func.sum(Fuel.liters)
    ).scalar() or 0

    total_fuel_cost = db.query(
        func.sum(Fuel.cost)
    ).scalar() or 0

    average_fuel_bill = db.query(
        func.avg(Fuel.cost)
    ).scalar() or 0

    highest_fuel_bill = db.query(
        func.max(Fuel.cost)
    ).scalar() or 0

    lowest_fuel_bill = db.query(
        func.min(Fuel.cost)
    ).scalar() or 0

    return {
        "total_records": total_records,
        "total_fuel_consumed": round(total_fuel_consumed, 2),
        "total_fuel_cost": round(total_fuel_cost, 2),
        "average_fuel_bill": round(average_fuel_bill, 2),
        "highest_fuel_bill": round(highest_fuel_bill, 2),
        "lowest_fuel_bill": round(lowest_fuel_bill, 2)
    }


@router.get("/vehicle/{vehicle_id}")
def vehicle_fuel_analytics(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    records = db.query(Fuel).filter(
        Fuel.vehicle_id == vehicle_id
    ).all()

    if not records:
        return {
            "vehicle_id": vehicle_id,
            "total_records": 0,
            "total_liters": 0,
            "total_cost": 0,
            "average_bill": 0
        }

    total_records = len(records)
    total_liters = sum(record.liters for record in records)
    total_cost = sum(record.cost for record in records)

    return {
        "vehicle_id": vehicle_id,
        "total_records": total_records,
        "total_liters": round(total_liters, 2),
        "total_cost": round(total_cost, 2),
        "average_bill": round(total_cost / total_records, 2)
    }