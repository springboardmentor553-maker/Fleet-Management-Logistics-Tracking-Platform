from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies import (
    get_db,
    require_role,
)

from app.models.user import User
from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle

from app.schemas.report import (
    MaintenanceReportResponse,
)

router = APIRouter()


# ---------------------------------
# Maintenance Report
# ---------------------------------
@router.get(
    "/maintenance",
    response_model=MaintenanceReportResponse
)
def maintenance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher"
        )
    ),
):

    total_records = db.query(
        Maintenance
    ).count()

    vehicles_under_maintenance = db.query(
        Vehicle
    ).filter(
        Vehicle.status == "maintenance"
    ).count()

    completed_services = db.query(
        Maintenance
    ).filter(
        Maintenance.maintenance_status == "Completed"
    ).count()

    overdue_services = db.query(
        Maintenance
    ).filter(
        Maintenance.next_service_date < datetime.utcnow()
    ).count()

    total_cost = db.query(
        func.sum(Maintenance.service_cost)
    ).scalar() or 0

    frequent = (
        db.query(
            Maintenance.maintenance_category,
            func.count(
                Maintenance.id
            ).label("count")
        )
        .group_by(
            Maintenance.maintenance_category
        )
        .order_by(
            func.count(
                Maintenance.id
            ).desc()
        )
        .first()
    )

    return {
        "totalMaintenanceRecords": total_records,
        "vehiclesUnderMaintenance": vehicles_under_maintenance,
        "completedServices": completed_services,
        "overdueServices": overdue_services,
        "totalMaintenanceCost": round(total_cost, 2),
        "mostFrequentMaintenanceCategory":
            frequent.maintenance_category if frequent else "N/A",
    }