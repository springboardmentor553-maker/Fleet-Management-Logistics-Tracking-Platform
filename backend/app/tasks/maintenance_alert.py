from datetime import datetime, timedelta

from celery_app import celery_app

from app.database import SessionLocal
from app.models.maintenance import Maintenance
from app.models.maintenance_alert import MaintenanceAlert


# Reminder period: 7 days
REMINDER_DAYS = 7


@celery_app.task
def check_maintenance_schedules():

    db = SessionLocal()

    try:
        today = datetime.utcnow().date()
        reminder_date = today + timedelta(days=REMINDER_DAYS)

        maintenance_records = db.query(Maintenance).all()

        for maintenance in maintenance_records:

            service_date = maintenance.next_service_date.date()

            # Check whether service is due within
            # the configured reminder period
            if today <= service_date <= reminder_date:

                # Check for an existing pending alert
                existing_alert = (
                    db.query(MaintenanceAlert)
                    .filter(
                        MaintenanceAlert.maintenance_id
                        == maintenance.id,
                        MaintenanceAlert.alert_status
                        == "Pending"
                    )
                    .first()
                )

                # Do not create duplicate pending alerts
                if existing_alert:
                    continue

                alert = MaintenanceAlert(
                    vehicle_id=maintenance.vehicle_id,
                    maintenance_id=maintenance.id,
                    alert_message=(
                        "Vehicle maintenance is due "
                        "within 7 days."
                    ),
                    alert_type="Maintenance Due",
                    alert_status="Pending",
                    next_service_date=service_date,
                )

                db.add(alert)

        db.commit()

    finally:
        db.close()