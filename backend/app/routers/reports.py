from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import Dict, Any

from app.database import get_db
from app.models.maintenance import Maintenance, MaintenanceStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.utils.dependencies import require_manager
from app.models.user import UserRole

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/maintenance", response_model=Dict[str, Any], dependencies=[Depends(require_manager)])
def get_maintenance_report(
    db: Session = Depends(get_db)
):
    # Total maintenance records
    total_records = db.query(Maintenance).count()

    # Maintenance in progress
    in_progress_services = db.query(Maintenance).filter(Maintenance.maintenance_status == MaintenanceStatus.IN_PROGRESS).count()

    # Vehicles under maintenance
    vehicles_under_maintenance = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()

    # Completed services
    completed_services = db.query(Maintenance).filter(Maintenance.maintenance_status == MaintenanceStatus.COMPLETED).count()

    # Overdue services (scheduled and date passed)
    today = datetime.now(timezone.utc)
    overdue_services = db.query(Maintenance).filter(
        Maintenance.maintenance_status == MaintenanceStatus.SCHEDULED,
        Maintenance.next_service_date < today
    ).count()

    # Total maintenance cost
    total_cost = db.query(func.sum(Maintenance.service_cost)).scalar() or 0.0

    # Most frequent maintenance category
    category_counts = db.query(
        Maintenance.maintenance_category, 
        func.count(Maintenance.id).label("count")
    ).group_by(Maintenance.maintenance_category).order_by(func.count(Maintenance.id).desc()).first()
    
    most_frequent_category = category_counts[0].value if category_counts else ""

    # UI expected keys
    scheduled_services = db.query(Maintenance).filter(Maintenance.maintenance_status == MaintenanceStatus.SCHEDULED).count()
    
    return {
        # Mentor expected keys
        "total_maintenance_records": total_records,
        "vehicles_under_maintenance": vehicles_under_maintenance,
        "completed_services": completed_services,
        "overdue_services": overdue_services,
        "total_maintenance_cost": float(total_cost),
        "most_frequent_maintenance_category": most_frequent_category,
        
        # UI expected keys
        "total_records": total_records,
        "scheduled": scheduled_services,
        "in_progress": in_progress_services,
        "completed": completed_services,
        "overdue": overdue_services,
        "total_cost": float(total_cost)
    }
