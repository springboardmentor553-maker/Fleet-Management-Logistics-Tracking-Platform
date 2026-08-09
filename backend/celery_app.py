from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "fleetflow",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

celery_app.conf.timezone = "Asia/Kolkata"

celery_app.conf.beat_schedule = {
    "check-maintenance-schedules-daily": {
        "task": "app.tasks.maintenance_alert.check_maintenance_schedules",
        "schedule": crontab(
            hour=9,
            minute=0
        ),
    },
}

celery_app.conf.imports = (
    "app.tasks.maintenance_alert",
)