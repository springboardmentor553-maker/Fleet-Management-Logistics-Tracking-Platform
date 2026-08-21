from datetime import datetime, timedelta

from celery_app import celery_app

from app.database import SessionLocal
from app.models.maintenance import Maintenance
from app.models.maintenance_alert import MaintenanceAlert


# Reminder period required by the existing
# maintenance-alert workflow.
REMINDER_DAYS = 7


@celery_app.task
def check_maintenance_schedules():
    db = SessionLocal()

    try:
        today = datetime.utcnow().date()
        reminder_date = (
            today + timedelta(days=REMINDER_DAYS)
        )

        maintenance_records = (
            db.query(Maintenance).all()
        )

        created_count = 0

        for maintenance in maintenance_records:
            service_date = (
                maintenance.next_service_date.date()
            )

            # Create an alert when maintenance is due
            # today or within the next seven days.
            if today <= service_date <= reminder_date:
                existing_alert = (
                    db.query(MaintenanceAlert)
                    .filter(
                        MaintenanceAlert.maintenance_id
                        == maintenance.id,
                        MaintenanceAlert.alert_status
                        == "Pending",
                    )
                    .first()
                )

                # Prevent duplicate pending alerts.
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
                created_count += 1

        db.commit()

        return {
            "status": "completed",
            "alerts_created": created_count,
        }

    finally:
        db.close()