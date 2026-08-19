from datetime import datetime, timedelta

from app.celery import celery_app
from app.database import SessionLocal
from app.models import Maintenance, MaintenanceAlert
from app.enums import AlertStatus


@celery_app.task
def check_maintenance_schedule():

    db = SessionLocal()

    try:
        reminder_days = 7
        reminder_date = datetime.utcnow() + timedelta(days=reminder_days)

        maintenances = (
            db.query(Maintenance)
            .filter(Maintenance.next_service_date <= reminder_date)
            .all()
        )

        for maintenance in maintenances:

            existing_alert = (
                db.query(MaintenanceAlert)
                .filter(
                    MaintenanceAlert.maintenance_id == maintenance.maintenance_id,
                    MaintenanceAlert.alert_status == AlertStatus.PENDING
                )
                .first()
            )

            if existing_alert:
                continue

            alert = MaintenanceAlert(
                vehicle_id=maintenance.vehicle_id,
                maintenance_id=maintenance.maintenance_id,
                alert_message="Vehicle maintenance is due",
                alert_type="Scheduled Maintenance",
                alert_status=AlertStatus.PENDING,
                generated_date=datetime.utcnow(),
                next_service_date=maintenance.next_service_date
            )

            db.add(alert)

        db.commit()

        print("Maintenance schedule check completed.")

    finally:
        db.close()