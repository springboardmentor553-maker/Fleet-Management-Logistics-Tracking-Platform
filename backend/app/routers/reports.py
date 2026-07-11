from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

router = APIRouter()


def grouped_counts(db: Session, model, field):
    rows = db.query(field, func.count(model.id)).group_by(field).all()
    return {status or "unspecified": count for status, count in rows}


@router.get("/operations")
def operations_report(db: Session = Depends(get_db)):
    shipment_status = grouped_counts(db, models.Shipment, models.Shipment.status)
    vehicle_status = grouped_counts(db, models.Vehicle, models.Vehicle.status)
    driver_status = grouped_counts(db, models.Driver, models.Driver.status)
    maintenance_status = grouped_counts(
        db, models.MaintenanceRecord, models.MaintenanceRecord.status
    )

    total_maintenance_cost = (
        db.query(func.coalesce(func.sum(models.MaintenanceRecord.cost), 0)).scalar() or 0
    )
    total_capacity = db.query(func.coalesce(func.sum(models.Vehicle.capacity), 0)).scalar() or 0
    total_cargo_weight = db.query(func.coalesce(func.sum(models.Shipment.weight), 0)).scalar() or 0

    return {
        "shipments_by_status": shipment_status,
        "vehicles_by_status": vehicle_status,
        "drivers_by_status": driver_status,
        "maintenance_by_status": maintenance_status,
        "total_maintenance_cost": float(total_maintenance_cost),
        "total_vehicle_capacity": float(total_capacity),
        "total_cargo_weight": float(total_cargo_weight),
    }
