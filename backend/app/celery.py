from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "fleetflow",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
    include=["app.tasks"]
)

celery_app.conf.timezone = "Asia/Kolkata"

celery_app.conf.beat_schedule = {
    "maintenance-check": {
        "task": "app.tasks.check_maintenance_schedule",
        "schedule": 60.0,
    }
}