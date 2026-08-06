"""
maintenance_tasks.py
────────────────────
Celery periodic task that automatically generates MaintenanceAlert records
when a maintenance schedule is due within the configured reminder window.

Logic:
  1. Load all MaintenanceRecord rows that are in "scheduled" or "in_progress" status.
  2. For each record, compare today's date against:
       a. next_service_date  — if within REMINDER_DAYS_BEFORE, create a "service_due" alert
       b. scheduled_date     — if past today and still not done, create an "overdue" alert
  3. Skip if a "Pending" alert already exists for that maintenance record
     (prevents duplicates — same protection as the API layer).
  4. Commit all new alerts in one transaction.

Configuration:
  MAINTENANCE_REMINDER_DAYS (env, default 7): alert N days before next_service_date.
"""

import os
from datetime import datetime, timedelta

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert

REMINDER_DAYS = int(os.getenv("MAINTENANCE_REMINDER_DAYS", "7"))


def _already_has_pending_alert(db, maintenance_id: int) -> bool:
    """Return True if there is already a Pending alert for this maintenance record."""
    return (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.maintenance_id == maintenance_id,
            MaintenanceAlert.alert_status == "Pending",
        )
        .first()
        is not None
    )


@celery_app.task(name="app.tasks.maintenance_tasks.check_maintenance_schedules", bind=True)
def check_maintenance_schedules(self):
    """
    Periodic Celery task.

    Scans all active maintenance records and auto-generates alerts:
    - "overdue"     : scheduled_date has passed and service not completed
    - "service_due" : next_service_date is within REMINDER_DAYS window
    """
    db = SessionLocal()
    alerts_created = 0
    errors = []

    try:
        now   = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        reminder_cutoff = today + timedelta(days=REMINDER_DAYS)

        active_records = (
            db.query(MaintenanceRecord)
            .filter(MaintenanceRecord.status.in_(["scheduled", "in_progress"]))
            .all()
        )

        for record in active_records:
            # ── Overdue check ─────────────────────────────────────────────
            if (
                record.scheduled_date
                and record.scheduled_date < today
                and record.status in ("scheduled", "in_progress")
            ):
                if not _already_has_pending_alert(db, record.id):
                    days_overdue = (today - record.scheduled_date).days
                    alert = MaintenanceAlert(
                        vehicle_id=record.vehicle_id,
                        maintenance_id=record.id,
                        alert_message=(
                            f"OVERDUE: {record.category} for vehicle #{record.vehicle_id} "
                            f"is {days_overdue} day(s) overdue. "
                            f"Originally scheduled on {record.scheduled_date.strftime('%Y-%m-%d')}."
                        ),
                        alert_type="overdue",
                        alert_status="Pending",
                        generated_date=now,
                        next_service_date=record.next_service_date,
                    )
                    db.add(alert)
                    alerts_created += 1

            # ── Upcoming next_service_date check ──────────────────────────
            elif (
                record.next_service_date
                and today <= record.next_service_date <= reminder_cutoff
            ):
                if not _already_has_pending_alert(db, record.id):
                    days_left = (record.next_service_date - today).days
                    alert = MaintenanceAlert(
                        vehicle_id=record.vehicle_id,
                        maintenance_id=record.id,
                        alert_message=(
                            f"SERVICE DUE: {record.category} for vehicle #{record.vehicle_id} "
                            f"is due in {days_left} day(s) "
                            f"(on {record.next_service_date.strftime('%Y-%m-%d')})."
                        ),
                        alert_type="service_due",
                        alert_status="Pending",
                        generated_date=now,
                        next_service_date=record.next_service_date,
                    )
                    db.add(alert)
                    alerts_created += 1

        db.commit()
        result = {
            "status": "success",
            "checked_records": len(active_records),
            "alerts_created": alerts_created,
            "ran_at": now.isoformat(),
        }
        print(f"[Celery] check_maintenance_schedules -> {result}")
        return result

    except Exception as exc:
        db.rollback()
        error_msg = f"[Celery] check_maintenance_schedules FAILED: {exc}"
        print(error_msg)
        # Re-raise so Celery marks the task as FAILURE
        raise self.retry(exc=exc, countdown=60, max_retries=3)

    finally:
        db.close()


@celery_app.task(name="app.tasks.maintenance_tasks.trigger_alert_check")
def trigger_alert_check():
    """
    Convenience task that can be called manually via Swagger or CLI
    to immediately trigger the maintenance schedule check.
    Returns the same result dict as check_maintenance_schedules.
    """
    return check_maintenance_schedules.apply().get()
