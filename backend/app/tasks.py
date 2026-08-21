from datetime import datetime

from app.celery_app import celery
from app.database import SessionLocal

from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.fuel import Fuel
from app.models.maintenance import Maintenance
from app.models.maintenance_alert import MaintenanceAlert


# ==========================================================
# Test Task
# ==========================================================

@celery.task
def test_task():

    print("=" * 60)
    print("BACKGROUND TASK EXECUTED")
    print(datetime.now())
    print("=" * 60)

    return {
        "message": "Celery is working successfully"
    }


# ==========================================================
# Maintenance Alert Generator
# ==========================================================

@celery.task
def check_maintenance_alerts():

    db = SessionLocal()

    today = datetime.today().date()

    reminder_days = 7

    maintenances = db.query(Maintenance).all()

    for maintenance in maintenances:

        if maintenance.next_service_date is None:
            continue

        days_left = (
            maintenance.next_service_date - today
        ).days

        if 0 <= days_left <= reminder_days:

            existing = db.query(
                MaintenanceAlert
            ).filter(
                MaintenanceAlert.maintenance_id == maintenance.id,
                MaintenanceAlert.alert_status == "Pending"
            ).first()

            if existing:
                continue

            alert = MaintenanceAlert(

                vehicle_id=maintenance.vehicle_id,

                maintenance_id=maintenance.id,

                alert_message=f"Vehicle {maintenance.vehicle_id} requires service in {days_left} day(s).",

                alert_type="Service Reminder",

                alert_status="Pending",

                generated_date=today,

                next_service_date=maintenance.next_service_date

            )

            db.add(alert)

    db.commit()

    db.close()

    return "Maintenance alerts generated successfully."


# ==========================================================
# Delayed Trip Monitoring
# ==========================================================

@celery.task
def check_delayed_trips():

    db = SessionLocal()

    now = datetime.now()

    delayed = db.query(Trip).filter(
        Trip.expected_arrival < now,
        Trip.status != "Delivered"
    ).all()

    print("=" * 60)
    print("DELAYED TRIPS")
    print("=" * 60)

    for trip in delayed:

        print(
            f"Trip ID {trip.id} is delayed."
        )

    db.close()

    return f"{len(delayed)} delayed trips found."


# ==========================================================
# Daily Fleet Report
# ==========================================================

@celery.task
def generate_daily_report():

    db = SessionLocal()

    report = {

        "vehicles": db.query(Vehicle).count(),

        "drivers": db.query(Driver).count(),

        "trips": db.query(Trip).count(),

        "shipments": db.query(Shipment).count(),

        "maintenance_records": db.query(Maintenance).count(),

        "fuel_records": db.query(Fuel).count(),

        "available_vehicles": db.query(Vehicle).filter(
            Vehicle.status == "Available"
        ).count(),

        "vehicles_in_transit": db.query(Vehicle).filter(
            Vehicle.status == "In Transit"
        ).count(),

        "vehicles_under_maintenance": db.query(Vehicle).filter(
            Vehicle.status == "Maintenance"
        ).count(),

        "available_drivers": db.query(Driver).filter(
            Driver.status == "Available"
        ).count(),

        "assigned_drivers": db.query(Driver).filter(
            Driver.status == "Assigned"
        ).count(),

    }

    print("=" * 60)
    print("DAILY FLEET REPORT")
    print("=" * 60)

    for key, value in report.items():
        print(f"{key}: {value}")

    print("=" * 60)

    db.close()

    return report