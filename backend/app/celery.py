from celery import Celery
from celery.schedules import crontab
import logging
from backend.app.config import settings
from datetime import datetime, timedelta

from backend.app.database import SessionLocal
from backend.app.models.maintenance import Maintenance
from backend.app.models.maintenance_alert import MaintenanceAlert

logger = logging.getLogger(__name__)

# Configure Celery application with Redis as broker and backend
celery_app = Celery(
    "fleetflow_tasks",
    broker=settings.REDIS_BROKER_URL,
    backend=settings.REDIS_RESULT_BACKEND
)

# Optional configuration settings
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

# Beat Schedule configuration
celery_app.conf.beat_schedule = {
    "daily-maintenance-schedule-check": {
        "task": "backend.app.celery.check_maintenance_schedules",
        "schedule": crontab(hour=0, minute=0),  # runs once every day at midnight
    }
}


@celery_app.task
def check_maintenance_schedules():
    logger.info("Checking maintenance schedules...")
    print("Checking maintenance schedules...")

    session = SessionLocal()
    try:
        now = datetime.utcnow()
        upper_limit = now + timedelta(days=7)

        # Read all Maintenance records
        records = session.query(Maintenance).all()

        for record in records:
            if not record.next_service_date:
                continue

            # Compare next_service_date falls within the next 7 days (inclusive)
            if now <= record.next_service_date <= upper_limit:
                # Check whether a Pending MaintenanceAlert already exists
                exists = session.query(MaintenanceAlert).filter(
                    MaintenanceAlert.maintenance_id == record.id,
                    MaintenanceAlert.alert_status == "Pending"
                ).first()

                if exists:
                    continue

                new_alert = MaintenanceAlert(
                    alert_message="Maintenance is due soon.",
                    alert_type="Scheduled Maintenance",
                    alert_status="Pending",
                    generated_date=now,
                    next_service_date=record.next_service_date,
                    vehicle_id=record.vehicle_id,
                    maintenance_id=record.id
                )
                session.add(new_alert)

        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Error checking maintenance schedules: {e}")
        raise e
    finally:
        session.close()

