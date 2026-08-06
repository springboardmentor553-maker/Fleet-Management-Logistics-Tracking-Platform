from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional

from backend.app.database import get_db
from backend.app.models.maintenance import Maintenance
from backend.app.models.vehicle import Vehicle
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)

ALLOWED_ROLES = ["Admin", "Fleet Manager", "Dispatcher"]


@router.get("/maintenance")
def get_maintenance_report(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(ALLOWED_ROLES)),
):
    """Generate dynamic maintenance reports."""
    
    # 1. total_maintenance_records
    total_maintenance_records = db.query(func.count(Maintenance.id)).scalar() or 0

    # 2. vehicles_under_maintenance
    vehicles_under_maintenance = db.query(func.count(Vehicle.id)).filter(Vehicle.status == "Maintenance").scalar() or 0

    # 3. completed_services
    completed_services = db.query(func.count(Maintenance.id)).filter(Maintenance.maintenance_status == "Completed").scalar() or 0

    # 4. overdue_services
    current_time = datetime.utcnow()
    overdue_services = db.query(func.count(Maintenance.id)).filter(
        Maintenance.next_service_date < current_time,
        Maintenance.maintenance_status != "Completed"
    ).scalar() or 0

    # 5. total_maintenance_cost
    total_maintenance_cost = db.query(func.sum(Maintenance.service_cost)).scalar() or 0.0

    # 6. most_frequent_maintenance_category
    # Category with the highest count (return null if no records)
    category_query = (
        db.query(
            Maintenance.maintenance_category,
            func.count(Maintenance.id).label("cat_count")
        )
        .group_by(Maintenance.maintenance_category)
        .order_by(func.count(Maintenance.id).desc())
        .first()
    )

    most_frequent_maintenance_category: Optional[str] = None
    if category_query:
        most_frequent_maintenance_category = category_query[0]

    return {
        "total_maintenance_records": int(total_maintenance_records),
        "vehicles_under_maintenance": int(vehicles_under_maintenance),
        "completed_services": int(completed_services),
        "overdue_services": int(overdue_services),
        "total_maintenance_cost": float(total_maintenance_cost),
        "most_frequent_maintenance_category": most_frequent_maintenance_category,
    }
