import os
from celery import Celery
from celery.schedules import crontab

# Redis connection URL. Same Redis instance mentioned in the tech stack.
# Format: redis://<host>:<port>/<db_number>
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "fleetflow",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"],  # module(s) where @celery_app.task functions live
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    result_expires=3600,  # task results kept for 1 hour
)

celery_app.conf.beat_schedule = {
    "check-maintenance-alerts-daily": {
        "task": "app.tasks.check_maintenance_alerts",
        "schedule": crontab(hour=9, minute=0),  # every day at 9:00 AM
    },
}