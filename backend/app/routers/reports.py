from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models 
from typing import Optional
from math import radians, sin, cos, sqrt, atan2

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/maintenance")
def get_maintenance_report(db: Session = Depends(get_db)):
    """
    Task 3 — Maintenance Reports API.
    GET /reports/maintenance
    """
    records = db.query(models.Maintenance).all()

    def rec_status(m):
        return m.status.value if hasattr(m.status, "value") else m.status

    def rec_category(m):
        return m.category.value if hasattr(m.category, "value") else m.category

    total_records = len(records)
    completed_services = sum(1 for m in records if rec_status(m) == "completed")
    total_cost = sum(m.service_cost or 0 for m in records)

    today = datetime.utcnow().date()
    overdue_services = 0
    for m in records:
        if rec_status(m) in ("completed", "cancelled") or not m.next_service_date:
            continue
        next_date = m.next_service_date.date() if hasattr(m.next_service_date, "date") else m.next_service_date
        if next_date < today:
            overdue_services += 1

    vehicles_under_maintenance = (
        db.query(models.Vehicle).filter(models.Vehicle.status == "maintenance").count()
    )

    category_counts = {}
    for m in records:
        cat = rec_category(m)
        category_counts[cat] = category_counts.get(cat, 0) + 1
    most_frequent_category = max(category_counts, key=category_counts.get) if category_counts else None

    return {
        "total_maintenance_records": total_records,
        "vehicles_under_maintenance": vehicles_under_maintenance,
        "completed_services": completed_services,
        "overdue_services": overdue_services,
        "total_maintenance_cost": round(total_cost, 2),
        "most_frequent_maintenance_category": most_frequent_category,
    }

def _haversine_km(lat1, lng1, lat2, lng2):
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


@router.get("/fleet-utilization")
def get_fleet_utilization_report(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):

    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    window_hours = max((end_date - start_date).total_seconds() / 3600, 1)

    vehicles = db.query(models.Vehicle).all()
    trips = (
        db.query(models.Trip)
        .filter(models.Trip.scheduled_start >= start_date)
        .filter(models.Trip.scheduled_start <= end_date)
        .filter(models.Trip.status.in_(["completed", "ongoing"]))
        .all()
    )

    report = []
    for v in vehicles:
        vehicle_trips = [t for t in trips if t.vehicle_id == v.id]

        total_hours = 0.0
        total_distance = 0.0
        for t in vehicle_trips:
            if t.scheduled_end:
                total_hours += (t.scheduled_end - t.scheduled_start).total_seconds() / 3600
            if t.pickup_lat is not None and t.pickup_lng is not None and t.destination_lat is not None and t.destination_lng is not None:
                total_distance += _haversine_km(t.pickup_lat, t.pickup_lng, t.destination_lat, t.destination_lng)

        utilization_percent = min(round((total_hours / window_hours) * 100, 1), 100.0)

        report.append({
            "vehicle_id": v.id,
            "registration_number": v.registration_number,
            "utilization_percent": utilization_percent,
            "distance_km": round(total_distance, 1),
        })

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "vehicles": report,
    }