"""
celery_app.py
─────────────
Celery application configured for FleetFlow.

Broker  : Redis  (CELERY_BROKER_URL in .env, default redis://localhost:6379/0)
Backend : Redis  (CELERY_RESULT_BACKEND, same default)

The periodic beat schedule runs `check_maintenance_schedules` every hour so
that maintenance alerts are generated automatically without manual intervention.
"""

try:
    from celery import Celery
    from celery.schedules import crontab
    HAS_CELERY = True
except ImportError:
    HAS_CELERY = False

import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BROKER_URL  = os.getenv("CELERY_BROKER_URL",  "redis://localhost:6379/0")
RESULT_URL  = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

if HAS_CELERY:
    celery_app = Celery(
        "fleetflow",
        broker=BROKER_URL,
        backend=RESULT_URL,
        include=["app.tasks.maintenance_tasks"],
    )
else:
    class DummyCelery:
        def task(self, *args, **kwargs):
            def decorator(fn):
                fn.apply = lambda: fn
                fn.get = lambda: fn()
                return fn
            return decorator

        def conf(self):
            pass

    celery_app = DummyCelery()
if HAS_CELERY:
    celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # ── Beat schedule (periodic tasks) ──────────────────────────────────────
    beat_schedule={
        # Run every hour to check for upcoming / overdue maintenance
        "check-maintenance-every-hour": {
            "task": "app.tasks.maintenance_tasks.check_maintenance_schedules",
            "schedule": crontab(minute=0, hour="*"),   # top of every hour
        },
        # Also run a quick check every 5 minutes during development / testing
        "check-maintenance-every-5-min": {
            "task": "app.tasks.maintenance_tasks.check_maintenance_schedules",
            "schedule": crontab(minute="*/5"),
        },
    },
)
