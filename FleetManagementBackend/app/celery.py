import os

from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.getenv("REDIS_URL")

celery_app = Celery(
    "fleet_management",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    timezone="Asia/Kolkata",
    enable_utc=False,
)

celery_app.conf.beat_schedule = {
    "check-maintenance-every-day": {
        "task": "app.tasks.check_maintenance_schedule",
        "schedule": crontab(hour=0, minute=0),
    },
}

celery_app.autodiscover_tasks(["app"])