from datetime import date, timedelta
from app.celery_app import celery_app
from app.database import SessionLocal
from app import models


REMINDER_PERIOD_DAYS = 7


@celery_app.task
def generate_automatic_maintenance_alerts(reminder_days: int = REMINDER_PERIOD_DAYS):
    """
    Task 5 - Automatic Alert Generation Celery Task:
    1. Reads all active maintenance schedules.
    2. Compares the current date with next_service_date (or service_date).
    3. Creates a MaintenanceAlert (status='Pending') if servicing is due within reminder period or overdue.
    4. Prevents duplicate pending alerts for the same maintenance schedule.
    """
    db = SessionLocal()
    try:
        today = date.today()
        due_threshold = today + timedelta(days=reminder_days)

        # Retrieve active maintenance records that are not deleted and not completed
        records = (
            db.query(models.MaintenanceRecord)
            .filter(
                models.MaintenanceRecord.is_deleted == 0,
                ~models.MaintenanceRecord.status.ilike("completed"),
            )
            .all()
        )

        alert_count = 0
        for rec in records:
            # Determine effective target date
            target_date = rec.next_service_date or rec.service_date
            if not target_date:
                continue

            if target_date <= due_threshold:
                vehicle = db.get(models.Vehicle, rec.vehicle_id)
                v_num = vehicle.vehicle_number if vehicle else f"ID {rec.vehicle_id}"

                is_overdue = target_date < today
                if is_overdue:
                    alert_type = "Overdue Maintenance"
                    alert_msg = f"OVERDUE: Maintenance ({rec.category}) for vehicle {v_num} was due on {target_date}."
                else:
                    alert_type = "Upcoming Maintenance"
                    alert_msg = f"UPCOMING: Maintenance ({rec.category}) for vehicle {v_num} is scheduled on {target_date}."

                # Check if a pending alert already exists for this maintenance schedule (Task 2 validation)
                existing_pending_alert = (
                    db.query(models.MaintenanceAlert)
                    .filter(
                        models.MaintenanceAlert.maintenance_id == rec.id,
                        models.MaintenanceAlert.alert_status.ilike("Pending"),
                    )
                    .first()
                )

                if not existing_pending_alert:
                    new_alert = models.MaintenanceAlert(
                        vehicle_id=rec.vehicle_id,
                        maintenance_id=rec.id,
                        alert_message=alert_msg,
                        alert_type=alert_type,
                        alert_status="Pending",
                        next_service_date=target_date,
                    )
                    db.add(new_alert)
                    alert_count += 1

                # Also insert system notification for general feed
                existing_notif = (
                    db.query(models.Notification)
                    .filter(
                        models.Notification.title == f"{alert_type}: Vehicle {v_num}",
                        models.Notification.is_read == 0,
                    )
                    .first()
                )

                if not existing_notif:
                    notif = models.Notification(
                        title=f"{alert_type}: Vehicle {v_num}",
                        message=alert_msg,
                        level="warning" if is_overdue else "info",
                        is_read=0,
                    )
                    db.add(notif)

        db.commit()
        return f"Scanned maintenance schedules. Generated {alert_count} new pending maintenance alerts."
    finally:
        db.close()


@celery_app.task
def scan_upcoming_maintenance():
    """Alias task for backward compatibility with Celery Beat schedule."""
    return generate_automatic_maintenance_alerts()
