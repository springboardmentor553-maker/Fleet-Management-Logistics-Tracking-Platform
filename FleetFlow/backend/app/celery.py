import os
from celery import Celery
from celery.schedules import crontab

# Assuming REDIS_URL will point to the redis service defined in docker-compose
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "fleetflow",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks.maintenance_tasks"]
)

celery_app.conf.beat_schedule = {
    'check-maintenance-daily': {
        'task': 'app.tasks.maintenance_tasks.check_maintenance_schedules',
        'schedule': crontab(hour=0, minute=0),
    },
}
celery_app.conf.timezone = 'UTC'
