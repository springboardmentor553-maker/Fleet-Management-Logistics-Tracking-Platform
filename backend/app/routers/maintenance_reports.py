from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.maintenance import Maintenance

router = APIRouter(
    prefix="/reports",
    tags=["Maintenance Reports"]
)


@router.get("/maintenance")
def maintenance_report(
    db: Session = Depends(get_db)
):

    total_records = db.query(
        Maintenance
    ).count()

    vehicles_under_maintenance = db.query(
        Maintenance
    ).filter(
        Maintenance.status == "In Progress"
    ).count()

    completed_services = db.query(
        Maintenance
    ).filter(
        Maintenance.status == "Completed"
    ).count()

    overdue_services = db.query(
        Maintenance
    ).filter(
        Maintenance.status == "Overdue"
    ).count()

    total_cost = db.query(
        func.coalesce(
            func.sum(Maintenance.service_cost),
            0
        )
    ).scalar()

    category = db.query(
        Maintenance.maintenance_category,
        func.count(Maintenance.id).label("count")
    ).group_by(
        Maintenance.maintenance_category
    ).order_by(
        func.count(Maintenance.id).desc()
    ).first()

    return {

        "total_maintenance_records": total_records,

        "vehicles_under_maintenance": vehicles_under_maintenance,

        "completed_services": completed_services,

        "overdue_services": overdue_services,

        "total_maintenance_cost": total_cost,

        "most_frequent_maintenance_category":
            category.maintenance_category if category else None
    }