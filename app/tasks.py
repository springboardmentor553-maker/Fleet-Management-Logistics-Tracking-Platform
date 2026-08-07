from datetime import datetime

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.maintenance import Maintenance
from app.models.maintenance_alert import MaintenanceAlert
from app.services.notification_service import create_notification


@celery_app.task(name="app.tasks.check_maintenance_reminders")
def check_maintenance_reminders():

    db = SessionLocal()

    try:
        due_records = (
            db.query(Maintenance)
            .filter(
                Maintenance.maintenance_status != "Completed",
                Maintenance.next_service_date <= datetime.utcnow(),
            )
            .all()
        )

        alerts_created = 0

        for record in due_records:

            existing_alert = (
                db.query(MaintenanceAlert)
                .filter(
                    MaintenanceAlert.maintenance_id == record.id,
                    MaintenanceAlert.alert_status == "Active",
                )
                .first()
            )

            if existing_alert:
                continue

            new_alert = MaintenanceAlert(
                vehicle_id=record.vehicle_id,
                maintenance_id=record.id,
                alert_message=f"Maintenance due: {record.maintenance_category} for vehicle #{record.vehicle_id}",
                alert_status="Active",
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