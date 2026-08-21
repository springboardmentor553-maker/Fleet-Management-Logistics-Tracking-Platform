import os

from celery import Celery
from celery.schedules import crontab


# ============================================================
# REDIS CONFIGURATION
# ============================================================

REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0"
)


# ============================================================
# CELERY
# ============================================================

celery = Celery(
    "fleet_management",
    broker=REDIS_URL,
    backend=REDIS_URL,
)


# ============================================================
# CELERY CONFIGURATION
# ============================================================

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    timezone="Asia/Kolkata",

    enable_utc=True,

    beat_schedule={

        # Daily Maintenance Alert
        "maintenance-alert-check": {
            "task": "app.tasks.check_maintenance_alerts",
            "schedule": crontab(
                hour=9,
                minute=0
            ),
        },

        # Hourly Trip Monitoring
        "trip-monitor": {
            "task": "app.tasks.check_delayed_trips",
            "schedule": crontab(
                minute=0
            ),
        },

        # Daily Fleet Report
        "daily-fleet-report": {
            "task": "app.tasks.generate_daily_report",
            "schedule": crontab(
                hour=23,
                minute=0
            ),
        },

    },
)


# ============================================================
# TASK DISCOVERY
# ============================================================

celery.autodiscover_tasks(["app"])