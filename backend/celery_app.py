import os

from celery import Celery
from celery.schedules import crontab


REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0",
)


celery_app = Celery(
    "fleetflow",
    broker=REDIS_URL,
    backend=REDIS_URL,
)


celery_app.conf.update(
    timezone="Asia/Kolkata",
    enable_utc=True,
)


celery_app.conf.beat_schedule = {
    "check-maintenance-schedules-daily": {
        "task": (
            "app.tasks.maintenance_alert."
            "check_maintenance_schedules"
        ),
        "schedule": crontab(
            hour=9,
            minute=0,
        ),
    },
}


celery_app.conf.imports = (
    "app.tasks.maintenance_alert",
)