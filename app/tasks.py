from datetime import datetime, timedelta

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.maintenance import Maintenance
from app.models.maintenance_alert import MaintenanceAlert
from app.services.notification_service import create_notification


REMINDER_PERIOD_DAYS = 7


@celery_app.task(name="app.tasks.check_maintenance_reminders")
def check_maintenance_reminders():

    db = SessionLocal()

    try:
        reminder_cutoff = datetime.utcnow() + timedelta(days=REMINDER_PERIOD_DAYS)

        due_records = (
            db.query(Maintenance)
            .filter(
                Maintenance.maintenance_status != "Completed",
                Maintenance.next_service_date <= reminder_cutoff,
            )
            .all()
        )

        alerts_created = 0

        for record in due_records:

            existing_alert = (
                db.query(MaintenanceAlert)
                .filter(
                    MaintenanceAlert.maintenance_id == record.id,
                    MaintenanceAlert.alert_status == "Pending",
                )
                .first()
            )

            if existing_alert:
                continue

            new_alert = MaintenanceAlert(
                vehicle_id=record.vehicle_id,
                maintenance_id=record.id,
                alert_message=f"Maintenance due: {record.maintenance_category} for vehicle #{record.vehicle_id}",
                alert_type="Reminder",
                alert_status="Pending",
                next_service_date=record.next_service_date,
            )

            db.add(new_alert)

            create_notification(
                db=db,
                title="Automatic Maintenance Reminder",
                message=new_alert.alert_message,
                type="warning",
            )

            alerts_created += 1

        db.commit()

        return {"checked_records": len(due_records), "alerts_created": alerts_created}

    finally:
        db.close()