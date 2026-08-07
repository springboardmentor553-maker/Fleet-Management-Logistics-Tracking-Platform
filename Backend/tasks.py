from datetime import date, timedelta

from app.celery import celery_app
from app.database import SessionLocal
from app.models.maintenance import Maintenance
from app.models.maintenance_alert import MaintenanceAlert
from app.models.maintenance_alert_enum import AlertStatus
from app.models.maintenance_alert_type_enum import AlertType

REMINDER_DAYS = 7


@celery_app.task
def check_maintenance_schedule():

    db = SessionLocal()

    today = date.today()
    reminder_date = today + timedelta(days=REMINDER_DAYS)

    maintenance_records = (
        db.query(Maintenance)
        .all()
    )

    alerts_created = 0

    for maintenance in maintenance_records:

        if maintenance.next_service_date <= reminder_date:

            existing_alert = (
                db.query(MaintenanceAlert)
                .filter(
                    MaintenanceAlert.maintenance_id == maintenance.id,
                    MaintenanceAlert.alert_status == "Pending"
                )
                .first()
            )

            if existing_alert:
                continue

            alert = MaintenanceAlert(
                vehicle_id=maintenance.vehicle_id,
                maintenance_id=maintenance.id,
                alert_message=f"Vehicle {maintenance.vehicle_id} requires service on {maintenance.next_service_date}.",
                alert_type=AlertType.UPCOMING_SERVICE,
                alert_status=AlertStatus.PENDING,
                generated_date=date.today(),
                next_service_date=maintenance.next_service_date
                )

            db.add(alert)
            alerts_created += 1

    db.commit()
    db.close()

    return f"{alerts_created} alerts generated."