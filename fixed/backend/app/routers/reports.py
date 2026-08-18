from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
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

    # Filter maintenance by non-deleted records
    m_rows = (
        db.query(models.MaintenanceRecord.status, func.count(models.MaintenanceRecord.id))
        .filter(models.MaintenanceRecord.is_deleted == 0)
        .group_by(models.MaintenanceRecord.status)
        .all()
    )
    maintenance_status = {status or "unspecified": count for status, count in m_rows}

    # Category breakdown
    cat_rows = (
        db.query(
            models.MaintenanceRecord.category,
            func.count(models.MaintenanceRecord.id),
            func.coalesce(func.sum(models.MaintenanceRecord.cost), 0),
        )
        .filter(models.MaintenanceRecord.is_deleted == 0)
        .group_by(models.MaintenanceRecord.category)
        .all()
    )
    maintenance_by_category = {
        cat or "General Inspection": {"count": count, "total_cost": float(cost)}
        for cat, count, cost in cat_rows
    }

    total_maintenance_cost = (
        db.query(func.coalesce(func.sum(models.MaintenanceRecord.cost), 0))
        .filter(models.MaintenanceRecord.is_deleted == 0)
        .scalar()
        or 0
    )
    total_capacity = db.query(func.coalesce(func.sum(models.Vehicle.capacity), 0)).scalar() or 0
    total_cargo_weight = db.query(func.coalesce(func.sum(models.Shipment.weight), 0)).scalar() or 0

    total_fuel_liters = db.query(func.coalesce(func.sum(models.FuelRecord.liters), 0)).scalar() or 0
    total_fuel_cost = db.query(func.coalesce(func.sum(models.FuelRecord.total_cost), 0)).scalar() or 0

    return {
        "shipments_by_status": shipment_status,
        "vehicles_by_status": vehicle_status,
        "drivers_by_status": driver_status,
        "maintenance_by_status": maintenance_status,
        "maintenance_by_category": maintenance_by_category,
        "total_maintenance_cost": float(total_maintenance_cost),
        "total_vehicle_capacity": float(total_capacity),
        "total_cargo_weight": float(total_cargo_weight),
        "fuel_summary": {
            "total_liters": float(total_fuel_liters),
            "total_cost": float(total_fuel_cost),
        },
    }


@router.get("/maintenance")
def maintenance_report(db: Session = Depends(get_db)):
    """
    Task 3 - Maintenance Reports API
    Generates values dynamically from existing maintenance data:
    - Total Maintenance Records
    - Vehicles Under Maintenance
    - Completed Services
    - Overdue Services
    - Total Maintenance Cost
    - Most Frequent Maintenance Category
    """
    today = date.today()

    # Total Maintenance Records (excluding soft-deleted)
    total_records = (
        db.query(func.count(models.MaintenanceRecord.id))
        .filter(models.MaintenanceRecord.is_deleted == 0)
        .scalar()
        or 0
    )

    # Vehicles Under Maintenance
    vehicles_under_maint = (
        db.query(func.count(func.distinct(models.MaintenanceRecord.vehicle_id)))
        .filter(
            models.MaintenanceRecord.is_deleted == 0,
            models.MaintenanceRecord.status.in_(
                ["scheduled", "in_progress", "In Progress", "Scheduled", "maintenance", "Under Maintenance"]
            ),
        )
        .scalar()
        or 0
    )

    # Completed Services
    completed = (
        db.query(func.count(models.MaintenanceRecord.id))
        .filter(
            models.MaintenanceRecord.is_deleted == 0,
            models.MaintenanceRecord.status.ilike("completed"),
        )
        .scalar()
        or 0
    )

    # Overdue Services
    overdue = (
        db.query(func.count(models.MaintenanceRecord.id))
        .filter(
            models.MaintenanceRecord.is_deleted == 0,
            ~models.MaintenanceRecord.status.ilike("completed"),
            or_(
                models.MaintenanceRecord.service_date < today,
                models.MaintenanceRecord.next_service_date < today,
            ),
        )
        .scalar()
        or 0
    )

    # Total Maintenance Cost
    total_cost = (
        db.query(func.coalesce(func.sum(models.MaintenanceRecord.cost), 0))
        .filter(models.MaintenanceRecord.is_deleted == 0)
        .scalar()
        or 0
    )

    # Most Frequent Maintenance Category
    most_frequent_row = (
        db.query(
            models.MaintenanceRecord.category,
            func.count(models.MaintenanceRecord.id).label("count"),
        )
        .filter(models.MaintenanceRecord.is_deleted == 0)
        .group_by(models.MaintenanceRecord.category)
        .order_by(func.count(models.MaintenanceRecord.id).desc())
        .first()
    )
    most_frequent_category = most_frequent_row[0] if most_frequent_row else None

    return {
        "total_maintenance_records": total_records,
        "vehicles_under_maintenance": vehicles_under_maint,
        "completed_services": completed,
        "overdue_services": overdue,
        "total_maintenance_cost": float(total_cost),
        "most_frequent_maintenance_category": most_frequent_category,
    }
