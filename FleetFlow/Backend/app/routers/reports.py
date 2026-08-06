from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter
from datetime import datetime

from app.utils.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.schemas.maintenance_alert import MaintenanceReportResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/maintenance", response_model=MaintenanceReportResponse)
def get_maintenance_report(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Returns a dynamic maintenance report including:
    - Total maintenance records
    - Vehicles currently under maintenance
    - Completed services count
    - Overdue services count
    - Total maintenance cost
    - Most frequent maintenance category
    - Alert counts by status
    """
    # All records
    all_records = db.query(MaintenanceRecord).all()

    total_records = len(all_records)

    # Vehicles under maintenance (vehicle status = 'maintenance')
    vehicles_under_maintenance = (
        db.query(Vehicle)
        .filter(Vehicle.current_status == "maintenance")
        .count()
    )

    # Completed services
    completed_services = sum(1 for r in all_records if r.status == "completed")

    # Overdue: scheduled or in_progress with scheduled_date < today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    overdue_services = sum(
        1 for r in all_records
        if r.status in ("scheduled", "in_progress") and r.scheduled_date and r.scheduled_date < today
    )

    # Total cost (sum of all record costs)
    total_cost = sum(r.cost or 0.0 for r in all_records)

    # Most frequent category
    categories = [r.category for r in all_records if r.category]
    most_frequent_category = None
    if categories:
        counter = Counter(categories)
        most_frequent_category = counter.most_common(1)[0][0]

    # Alert stats
    all_alerts = db.query(MaintenanceAlert).all()
    pending_alerts   = sum(1 for a in all_alerts if a.alert_status == "Pending")
    sent_alerts      = sum(1 for a in all_alerts if a.alert_status == "Sent")
    completed_alerts = sum(1 for a in all_alerts if a.alert_status == "Completed")

    return MaintenanceReportResponse(
        total_records=total_records,
        vehicles_under_maintenance=vehicles_under_maintenance,
        completed_services=completed_services,
        overdue_services=overdue_services,
        total_maintenance_cost=round(total_cost, 2),
        most_frequent_category=most_frequent_category,
        pending_alerts=pending_alerts,
        sent_alerts=sent_alerts,
        completed_alerts=completed_alerts,
    )
