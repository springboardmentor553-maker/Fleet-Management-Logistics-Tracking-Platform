from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "fleetflow",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.maintenance_tasks",
        "app.tasks.eta_tasks",
        "app.tasks.shipment_tasks",
        "app.tasks.fuel_tasks",
        "app.tasks.dashboard_tasks"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_always_eager=True,
    task_store_eager_result=True,
)

# Configure periodic tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    # TASK 8: Scheduled Celery Tasks
    "maintenance_reminder_daily": {
        "task": "app.tasks.maintenance_tasks.check_maintenance_reminders",
        "schedule": crontab(hour=8, minute=0),
    },
    "eta_refresh_job": {
        "task": "app.tasks.eta_tasks.refresh_active_trip_etas",
        "schedule": crontab(minute="*/5"),
    },
    "fuel_analytics_job": {
        "task": "app.tasks.fuel_tasks.generate_fuel_analytics",
        "schedule": crontab(hour=0, minute=0), # Every night at midnight
    },
    "fleet_dashboard_refresh": {
        "task": "app.tasks.dashboard_tasks.refresh_fleet_dashboard_cache",
        "schedule": crontab(minute="*/1"), # Every minute
    },
    "shipment_monitor_job": {
        "task": "app.tasks.shipment_tasks.monitor_shipment_status",
        "schedule": crontab(minute="*/2"), # Every 2 minutes
    },
}
