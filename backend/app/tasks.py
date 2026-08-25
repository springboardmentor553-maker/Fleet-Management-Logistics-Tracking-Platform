from datetime import datetime, timedelta
from app.celery_app import celery_app
from app.database import SessionLocal
from app import models

DUE_SOON_WINDOW_DAYS = 3


@celery_app.task(name="app.tasks.ping")
def ping():
    return "pong"


@celery_app.task(name="app.tasks.check_maintenance_alerts")
def check_maintenance_alerts():
    db = SessionLocal()
    try:
        today = datetime.utcnow().date()
        due_soon_cutoff = today + timedelta(days=DUE_SOON_WINDOW_DAYS)

        records = (
            db.query(models.Maintenance)
            .filter(models.Maintenance.next_service_date.isnot(None))
            .filter(models.Maintenance.status.notin_(["completed", "cancelled"]))
            .all()
        )

        created_alert_ids = []
        overdue_ids = []
        due_soon_ids = []

        for r in records:
            next_date = r.next_service_date.date() if hasattr(r.next_service_date, "date") else r.next_service_date

            if next_date < today:
                alert_type = "overdue"
                overdue_ids.append(r.id)
                days_overdue = (today - next_date).days
                message = f"Service overdue by {days_overdue} day(s) — next service was due {next_date}"
            elif next_date <= due_soon_cutoff:
                alert_type = "due_soon"
                due_soon_ids.append(r.id)
                days_left = (next_date - today).days
                message = f"Service due in {days_left} day(s) — next service on {next_date}"
            else:
                continue

            # De-dup: skip if a PENDING alert already exists for this maintenance record
            existing_pending = (
                db.query(models.MaintenanceAlert)
                .filter(
                    models.MaintenanceAlert.maintenance_id == r.id,
                    models.MaintenanceAlert.status == "pending",
                )
                .first()
            )
            if existing_pending:
                continue

            new_alert = models.MaintenanceAlert(
                maintenance_id=r.id,
                vehicle_id=r.vehicle_id,
                alert_type=alert_type,
                message=message,
                status="pending",
                next_service_date=r.next_service_date,
                is_read=False,
            )
            db.add(new_alert)
            db.commit()
            db.refresh(new_alert)
            created_alert_ids.append(new_alert.id)

        print(f"[maintenance-alerts] {today}: overdue={overdue_ids} due_soon={due_soon_ids} new_alerts_created={created_alert_ids}")

        return {
            "checked_at": str(today),
            "overdue_ids": overdue_ids,
            "due_soon_ids": due_soon_ids,
            "new_alert_ids": created_alert_ids,
        }
    finally:
        db.close()