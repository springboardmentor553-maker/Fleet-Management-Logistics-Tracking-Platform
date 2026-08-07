from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance import Maintenance
from app.schemas.maintenance_report import MaintenanceReportResponse

router = APIRouter(
    prefix="/reports",
    tags=["Maintenance Reports"]
)


@router.get("/maintenance", response_model=MaintenanceReportResponse)
def maintenance_report(db: Session = Depends(get_db)):

    # Total Maintenance Records
    total_maintenance_records = (
        db.query(func.count(Maintenance.id))
        .scalar() or 0
    )

    # Vehicles Under Maintenance
    vehicles_under_maintenance = (
        db.query(func.count(Maintenance.id))
        .filter(Maintenance.maintenance_status == "Scheduled")
        .scalar() or 0
    )

    # Completed Services
    completed_services = (
        db.query(func.count(Maintenance.id))
        .filter(Maintenance.maintenance_status == "Completed")
        .scalar() or 0
    )

    # Overdue Services
    overdue_services = (
        db.query(func.count(Maintenance.id))
        .filter(
            Maintenance.next_service_date < date.today(),
            Maintenance.maintenance_status != "Completed"
        )
        .scalar() or 0
    )

    # Total Maintenance Cost
    total_maintenance_cost = (
        db.query(func.sum(Maintenance.service_cost))
        .scalar() or 0
    )

    # Most Frequent Maintenance Category
    most_frequent_category = (
        db.query(
            Maintenance.maintenance_category,
            func.count(Maintenance.id).label("count")
        )
        .group_by(Maintenance.maintenance_category)
        .order_by(func.count(Maintenance.id).desc())
        .first()
    )

    category = (
        most_frequent_category[0].value
        if most_frequent_category
        else "N/A"
    )

    return MaintenanceReportResponse(
        total_maintenance_records=total_maintenance_records,
        vehicles_under_maintenance=vehicles_under_maintenance,
        completed_services=completed_services,
        overdue_services=overdue_services,
        total_maintenance_cost=float(total_maintenance_cost),
        most_frequent_maintenance_category=category
    )