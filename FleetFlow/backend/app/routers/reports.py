"""Reports router — Task 3.

Endpoints
---------
GET    /reports/maintenance     Maintenance summary reports
"""

import logging
from datetime import date as DateType

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import MaintenanceStatusEnum, VehicleStatusEnum
from app.models.maintenance import MaintenanceRecord
from app.models.vehicle import Vehicle
from app.services.security import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class MaintenanceReportResponse(BaseModel):
    total_maintenance_records: int
    vehicles_under_maintenance: int
    completed_services: int
    overdue_services: int
    total_maintenance_cost: float
    most_frequent_maintenance_category: str | None


# ─────────────────────────────────────────────────────────────────────────────
# GET /reports/maintenance — Maintenance Reports
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/maintenance",
    response_model=MaintenanceReportResponse,
    summary="Get maintenance summary report",
)
def get_maintenance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = DateType.today()

    # Total Maintenance Records
    total_records = db.query(func.count(MaintenanceRecord.id)).scalar() or 0

    # Vehicles Under Maintenance
    # We can check the vehicles table for current_status == MAINTENANCE
    vehicles_under_maintenance = (
        db.query(func.count(Vehicle.id))
        .filter(Vehicle.current_status == VehicleStatusEnum.MAINTENANCE)
        .scalar() or 0
    )

    # Completed Services
    completed_services = (
        db.query(func.count(MaintenanceRecord.id))
        .filter(MaintenanceRecord.status == MaintenanceStatusEnum.COMPLETED)
        .scalar() or 0
    )

    # Overdue Services
    # Status is SCHEDULED but the service_date is in the past
    overdue_services = (
        db.query(func.count(MaintenanceRecord.id))
        .filter(
            MaintenanceRecord.status == MaintenanceStatusEnum.SCHEDULED,
            MaintenanceRecord.service_date < today
        )
        .scalar() or 0
    )

    # Total Maintenance Cost
    total_cost = (
        db.query(func.sum(MaintenanceRecord.service_cost))
        .scalar() or 0.0
    )

    # Most Frequent Maintenance Category
    most_frequent_category = (
        db.query(MaintenanceRecord.category)
        .group_by(MaintenanceRecord.category)
        .order_by(func.count(MaintenanceRecord.id).desc())
        .first()
    )
    most_frequent_category_str = most_frequent_category[0].value if most_frequent_category else None

    return MaintenanceReportResponse(
        total_maintenance_records=total_records,
        vehicles_under_maintenance=vehicles_under_maintenance,
        completed_services=completed_services,
        overdue_services=overdue_services,
        total_maintenance_cost=total_cost,
        most_frequent_maintenance_category=most_frequent_category_str
    )
