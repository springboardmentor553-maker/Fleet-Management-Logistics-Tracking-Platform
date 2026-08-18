import os
from celery import Celery
from app.config import settings

# Initialize Celery app instance
celery_app = Celery(
    "fleetflow_celery",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.maintenance_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Scheduled cron background tasks (Celery Beat) for periodic maintenance checks
celery_app.conf.beat_schedule = {
    "generate-automatic-maintenance-alerts-daily": {
        "task": "app.tasks.maintenance_tasks.generate_automatic_maintenance_alerts",
        "schedule": 86400.0,  # Run daily
    },
}
