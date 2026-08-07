from celery import Celery

celery_app = Celery(
    "freightflow",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

celery_app.conf.timezone = "UTC"

celery_app.conf.beat_schedule = {
    "check-maintenance-reminders-every-minute": {
        "task": "app.tasks.check_maintenance_reminders",
        "schedule": 60.0,
    },
}

import app.tasks