from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "fleet_management",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

celery_app.conf.update(
    timezone="Asia/Kolkata",
    enable_utc=False,
)

celery_app.conf.beat_schedule = {
    "check-maintenance-every-day": {
        "task": "app.tasks.check_maintenance_schedule",
        "schedule": crontab(hour=0, minute=0),   # Every day at midnight
    },
}

celery_app.autodiscover_tasks(["app"])