from celery import Celery
from celery.schedules import crontab
import logging

logger = logging.getLogger(__name__)

# Configure Celery application with Redis as broker and backend
celery_app = Celery(
    "fleetflow_tasks",
    broker="redis://127.0.0.1:6379/0",
    backend="redis://127.0.0.1:6379/0"
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
