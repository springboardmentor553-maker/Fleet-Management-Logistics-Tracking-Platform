import os
from datetime import datetime, timedelta

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.models.notification import Notification

REMINDER_DAYS = int(os.getenv("MAINTENANCE_REMINDER_DAYS", "7"))


def _already_has_pending_alert(db, maintenance_id: int) -> bool:
    """Return True if a Pending alert already exists."""
    return (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.maintenance_id == maintenance_id,
            MaintenanceAlert.alert_status == "Pending",
        )
        .first()
        is not None
    )


def _create_notification(db, alert):
    """Create a notification for a newly generated maintenance alert."""

    notification = Notification(
        user_id=None,
        title=f"Maintenance Alert - Vehicle #{alert.vehicle_id}",
        message=alert.alert_message,
        category="maintenance_alert",
        channel_email=False,
        channel_sms=False,
        channel_push=True,
        priority="normal",
        reference_id=alert.id,
        reference_type="maintenance_alert",
        created_at=datetime.utcnow(),
    )

    db.add(notification)


@celery_app.task(
    name="app.tasks.maintenance_tasks.check_maintenance_schedules",
    bind=True,
)
def check_maintenance_schedules(self):
    """
    Automatically checks maintenance schedules.

    Generates alerts for:

    1. Maintenance scheduled for today
    2. Maintenance that is overdue
    3. Upcoming next service within REMINDER_DAYS

    Completed maintenance is ignored.

    Every automatically generated alert also creates
    a corresponding notification.
    """

    db = SessionLocal()
    alerts_created = 0
    notifications_created = 0

    try:
        now = datetime.utcnow()

        today = now.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        tomorrow = today + timedelta(days=1)

        reminder_cutoff = today + timedelta(days=REMINDER_DAYS)

        # Only active maintenance records
        active_records = (
            db.query(MaintenanceRecord)
            .filter(
                MaintenanceRecord.status.in_(
                    ["scheduled", "in_progress"]
                )
            )
            .all()
        )

        for record in active_records:

            # ---------------------------------------------------------
            # 1. MAINTENANCE SCHEDULED FOR TODAY
            # ---------------------------------------------------------
            if (
                record.scheduled_date
                and today <= record.scheduled_date < tomorrow
            ):

                if not _already_has_pending_alert(db, record.id):

                    alert = MaintenanceAlert(
                        vehicle_id=record.vehicle_id,
                        maintenance_id=record.id,
                        alert_message=(
                            f"MAINTENANCE DUE TODAY: "
                            f"{record.category} for vehicle "
                            f"#{record.vehicle_id} is scheduled for today."
                        ),
                        alert_type="service_due",
                        alert_status="Pending",
                        generated_date=now,
                        next_service_date=record.next_service_date,
                    )

                    db.add(alert)

                    # Get alert ID before creating notification
                    db.flush()

                    _create_notification(db, alert)

                    alerts_created += 1
                    notifications_created += 1

                    continue

            # ---------------------------------------------------------
            # 2. OVERDUE MAINTENANCE
            # ---------------------------------------------------------
            if (
                record.scheduled_date
                and record.scheduled_date < today
            ):

                if not _already_has_pending_alert(db, record.id):

                    days_overdue = (
                        today - record.scheduled_date
                    ).days

                    alert = MaintenanceAlert(
                        vehicle_id=record.vehicle_id,
                        maintenance_id=record.id,
                        alert_message=(
                            f"OVERDUE: {record.category} for vehicle "
                            f"#{record.vehicle_id} is "
                            f"{days_overdue} day(s) overdue. "
                            f"Originally scheduled on "
                            f"{record.scheduled_date.strftime('%Y-%m-%d')}."
                        ),
                        alert_type="overdue",
                        alert_status="Pending",
                        generated_date=now,
                        next_service_date=record.next_service_date,
                    )

                    db.add(alert)

                    db.flush()

                    _create_notification(db, alert)

                    alerts_created += 1
                    notifications_created += 1

                    continue

            # ---------------------------------------------------------
            # 3. UPCOMING NEXT SERVICE
            # ---------------------------------------------------------
            if (
                record.next_service_date
                and today <= record.next_service_date <= reminder_cutoff
            ):

                if not _already_has_pending_alert(db, record.id):

                    days_left = (
                        record.next_service_date - today
                    ).days

                    alert = MaintenanceAlert(
                        vehicle_id=record.vehicle_id,
                        maintenance_id=record.id,
                        alert_message=(
                            f"SERVICE DUE: {record.category} for vehicle "
                            f"#{record.vehicle_id} is due in "
                            f"{days_left} day(s) "
                            f"(on {record.next_service_date.strftime('%Y-%m-%d')})."
                        ),
                        alert_type="service_due",
                        alert_status="Pending",
                        generated_date=now,
                        next_service_date=record.next_service_date,
                    )

                    db.add(alert)

                    db.flush()

                    _create_notification(db, alert)

                    alerts_created += 1
                    notifications_created += 1

        db.commit()

        result = {
            "status": "success",
            "checked_records": len(active_records),
            "alerts_created": alerts_created,
            "notifications_created": notifications_created,
            "ran_at": now.isoformat(),
        }

        print(
            f"[Celery] check_maintenance_schedules -> {result}"
        )

        return result

    except Exception as exc:

        db.rollback()

        error_msg = (
            f"[Celery] check_maintenance_schedules FAILED: {exc}"
        )

        print(error_msg)

        raise self.retry(
            exc=exc,
            countdown=60,
            max_retries=3,
        )

    finally:
        db.close()


@celery_app.task(
    name="app.tasks.maintenance_tasks.trigger_alert_check"
)
def trigger_alert_check():
    """
    Manually trigger the maintenance schedule check.
    """

    return check_maintenance_schedules.apply().get()