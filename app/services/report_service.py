from datetime import datetime

from sqlalchemy.orm import Session

from app.models.maintenance import Maintenance
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.fuel_record import FuelRecord


# =====================================
# Maintenance Report
# =====================================

def get_maintenance_report(db: Session):

    records = db.query(Maintenance).all()

    total_records = len(records)
    total_cost = round(sum(r.service_cost for r in records), 2)

    vehicles_under_maintenance = (
        db.query(Vehicle).filter(Vehicle.status == "Under Maintenance").count()
    )

    completed_services = len([r for r in records if r.maintenance_status == "Completed"])

    overdue_services = len([
        r for r in records
        if r.maintenance_status != "Completed"
        and r.next_service_date is not None
        and r.next_service_date <= datetime.utcnow()
    ])

    by_category = {}
    for r in records:
        by_category[r.maintenance_category] = by_category.get(r.maintenance_category, 0) + 1

    most_frequent_category = (
        max(by_category, key=by_category.get) if by_category else None
    )

    by_status = {}
    for r in records:
        by_status[r.maintenance_status] = by_status.get(r.maintenance_status, 0) + 1

    return {
        "total_maintenance_records": total_records,
        "vehicles_under_maintenance": vehicles_under_maintenance,
        "completed_services": completed_services,
        "overdue_services": overdue_services,
        "total_maintenance_cost": total_cost,
        "most_frequent_maintenance_category": most_frequent_category,
        "records_by_category": by_category,
        "records_by_status": by_status,
    }


# =====================================
# Operational Report
# =====================================

def get_operational_report(db: Session):

    total_trips = db.query(Trip).count()
    completed_trips = db.query(Trip).filter(Trip.status == "Completed").count()
    active_trips = db.query(Trip).filter(Trip.status.in_(["Scheduled", "In Progress"])).count()
    cancelled_trips = db.query(Trip).filter(Trip.status == "Cancelled").count()

    total_vehicles = db.query(Vehicle).count()
    available_vehicles = db.query(Vehicle).filter(Vehicle.status == "Available").count()

    total_drivers = db.query(Driver).count()
    available_drivers = db.query(Driver).filter(Driver.status == "Available").count()

    fuel_records = db.query(FuelRecord).all()
    total_fuel_cost = round(sum(r.cost for r in fuel_records), 2)

    completion_rate = (
        round((completed_trips / total_trips) * 100, 2) if total_trips > 0 else 0
    )

    return {
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_trips": active_trips,
        "cancelled_trips": cancelled_trips,
        "trip_completion_rate_percent": completion_rate,
        "total_vehicles": total_vehicles,
        "available_vehicles": available_vehicles,
        "total_drivers": total_drivers,
        "available_drivers": available_drivers,
        "total_fuel_cost": total_fuel_cost,
    }