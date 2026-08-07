from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.fuel_record import FuelRecord
from app.models.vehicle import Vehicle
from app.schemas.fuel_record import FuelRecordCreate


def create_fuel_record(record: FuelRecordCreate, db: Session):

    vehicle = db.query(Vehicle).filter(Vehicle.id == record.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    new_record = FuelRecord(**record.model_dump())

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


def get_all_fuel_records(db: Session):
    return db.query(FuelRecord).all()


def get_fuel_record(record_id: int, db: Session):
    record = db.query(FuelRecord).filter(FuelRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Fuel record not found")
    return record


def get_vehicle_fuel_records(vehicle_id: int, db: Session):
    return db.query(FuelRecord).filter(FuelRecord.vehicle_id == vehicle_id).all()


# =====================================
# Fuel Analytics (Task 4)
# =====================================

def get_fuel_analytics(db: Session):

    records = db.query(FuelRecord).all()

    total_liters = sum(r.liters for r in records)
    total_cost = sum(r.cost for r in records)
    total_records = len(records)
    average_cost_per_liter = round(total_cost / total_liters, 2) if total_liters > 0 else 0

    return {
        "total_records": total_records,
        "total_liters": round(total_liters, 2),
        "total_cost": round(total_cost, 2),
        "average_cost_per_liter": average_cost_per_liter,
    }