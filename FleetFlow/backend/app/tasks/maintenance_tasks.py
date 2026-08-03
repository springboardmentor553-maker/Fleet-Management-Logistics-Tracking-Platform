import logging
from datetime import date, timedelta
from app.celery import celery_app
from app.database import SessionLocal
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.models.enums import MaintenanceStatusEnum, AlertStatusEnum

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.maintenance_tasks.check_maintenance_schedules")
def check_maintenance_schedules():
    """
    Periodic task to check for upcoming and overdue maintenance records
    and generate alerts.
    """
    logger.info("Running check_maintenance_schedules task...")
    db = SessionLocal()
    try:
        today = date.today()
        # Look ahead 7 days for upcoming service
        upcoming_threshold = today + timedelta(days=7)

        # Get records with a next_service_date that is within the 7-day reminder period
        records = (
            db.query(MaintenanceRecord)
            .filter(MaintenanceRecord.next_service_date.isnot(None))
            .filter(MaintenanceRecord.next_service_date <= upcoming_threshold)
            .all()
        )

        new_alerts_count = 0
        for record in records:
            # Check if an alert already exists (Pending or Sent) for this maintenance task's next_service_date
            existing_alert = (
                db.query(MaintenanceAlert)
                .filter(
                    MaintenanceAlert.maintenance_id == record.id,
                    MaintenanceAlert.status.in_([AlertStatusEnum.PENDING, AlertStatusEnum.SENT])
                )
                .first()
            )

            if not existing_alert:
                if record.next_service_date < today:
                    alert_type = "OVERDUE"
                    message = f"Follow-up for maintenance '{record.category.value}' is overdue since {record.next_service_date}."
                elif record.next_service_date == today:
                    alert_type = "TODAY"
                    message = f"Follow-up for maintenance '{record.category.value}' is due today."
                else:
                    alert_type = "UPCOMING"
                    message = f"Follow-up for maintenance '{record.category.value}' is due on {record.next_service_date}."

                new_alert = MaintenanceAlert(
                    vehicle_id=record.vehicle_id,
                    maintenance_id=record.id,
                    alert_message=message,
                    alert_type=alert_type,
                    next_service_date=record.next_service_date,
                    status=AlertStatusEnum.PENDING
                )
                db.add(new_alert)
                new_alerts_count += 1
                logger.info(f"Generated {alert_type} alert for vehicle {record.vehicle_id}, maintenance {record.id}")

        if new_alerts_count > 0:
            db.commit()
            logger.info(f"Successfully generated {new_alerts_count} new maintenance alerts.")
        else:
            logger.info("No new maintenance alerts to generate.")

    except Exception as e:
        logger.error(f"Error checking maintenance schedules: {str(e)}")
        db.rollback()
    finally:
        db.close()
