import os
from datetime import datetime, timedelta

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.models.notification import Notification


REMINDER_DAYS = int(
    os.getenv("MAINTENANCE_REMINDER_DAYS", "7")
)


def _already_has_pending_alert(db, maintenance_id: int) -> bool:
    """Check whether a pending alert already exists."""

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
    """Create a notification for a maintenance alert."""

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


def run_maintenance_alerts_check(db):
    """Synchronous runner to generate alerts & notifications for maintenance schedules."""
    alerts_created = 0
    notifications_created = 0

    now = datetime.utcnow()
    today = now.date()
    tomorrow = today + timedelta(days=1)
    reminder_cutoff = today + timedelta(days=REMINDER_DAYS)

    active_records = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.status.in_(["scheduled", "in_progress"]))
        .all()
    )

    for record in active_records:
        if _already_has_pending_alert(db, record.id):
            continue

        scheduled_date = record.scheduled_date.date() if record.scheduled_date else None
        next_service_date = record.next_service_date.date() if record.next_service_date else None

        # 1. TOMORROW
        if scheduled_date and scheduled_date == tomorrow:
            alert = MaintenanceAlert(
                vehicle_id=record.vehicle_id,
                maintenance_id=record.id,
                alert_message=f"UPCOMING: {record.category} for vehicle #{record.vehicle_id} is scheduled for tomorrow ({scheduled_date}).",
                alert_type="upcoming",
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

        # 2. TODAY
        if scheduled_date and scheduled_date == today:
            alert = MaintenanceAlert(
                vehicle_id=record.vehicle_id,
                maintenance_id=record.id,
                alert_message=f"MAINTENANCE DUE TODAY: {record.category} for vehicle #{record.vehicle_id} is scheduled for today.",
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
            continue

        # 3. OVERDUE
        if scheduled_date and scheduled_date < today:
            days_overdue = (today - scheduled_date).days
            alert = MaintenanceAlert(
                vehicle_id=record.vehicle_id,
                maintenance_id=record.id,
                alert_message=f"OVERDUE: {record.category} for vehicle #{record.vehicle_id} is {days_overdue} day(s) overdue. Originally scheduled on {scheduled_date}.",
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

        # 4. NEXT SERVICE REMINDER
        if next_service_date and today <= next_service_date <= reminder_cutoff:
            days_left = (next_service_date - today).days
            alert = MaintenanceAlert(
                vehicle_id=record.vehicle_id,
                maintenance_id=record.id,
                alert_message=f"SERVICE DUE: {record.category} for vehicle #{record.vehicle_id} is due in {days_left} day(s) (on {next_service_date}).",
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
            continue

    db.commit()
    return {
        "status": "success",
        "checked_records": len(active_records),
        "alerts_created": alerts_created,
        "notifications_created": notifications_created,
        "ran_at": now.isoformat(),
    }


@celery_app.task(
    name="app.tasks.maintenance_tasks.check_maintenance_schedules",
    bind=True,
)
def check_maintenance_schedules(self):
    return run_maintenance_alerts_check(SessionLocal())

    db = SessionLocal()

    alerts_created = 0
    notifications_created = 0

    try:

        # ---------------------------------------------------------
        # CURRENT DATE
        # ---------------------------------------------------------

        now = datetime.utcnow()
        today = now.date()

        tomorrow = today + timedelta(days=1)

        reminder_cutoff = today + timedelta(
            days=REMINDER_DAYS
        )

        print(
            f"[Celery] Checking maintenance schedules..."
        )

        print(
            f"[Celery] Today: {today}"
        )

        print(
            f"[Celery] Tomorrow: {tomorrow}"
        )

        print(
            f"[Celery] Reminder cutoff: {reminder_cutoff}"
        )

        # ---------------------------------------------------------
        # GET ACTIVE MAINTENANCE
        # ---------------------------------------------------------

        active_records = (
            db.query(MaintenanceRecord)
            .filter(
                MaintenanceRecord.status.in_(
                    [
                        "scheduled",
                        "in_progress",
                    ]
                )
            )
            .all()
        )

        print(
            f"[Celery] Active maintenance records: "
            f"{len(active_records)}"
        )

        # ---------------------------------------------------------
        # PROCESS RECORDS
        # ---------------------------------------------------------

        for record in active_records:

            print(
                f"[Celery] Checking maintenance "
                f"ID={record.id}, "
                f"vehicle={record.vehicle_id}"
            )

            # -----------------------------------------------------
            # Convert datetime → date
            # -----------------------------------------------------

            scheduled_date = None

            if record.scheduled_date:
                scheduled_date = record.scheduled_date.date()

            next_service_date = None

            if record.next_service_date:
                next_service_date = record.next_service_date.date()

            print(
                f"[Celery] scheduled_date={scheduled_date}"
            )

            print(
                f"[Celery] next_service_date={next_service_date}"
            )

            # -----------------------------------------------------
            # DUPLICATE CHECK
            # -----------------------------------------------------

            if _already_has_pending_alert(
                db,
                record.id,
            ):

                print(
                    f"[Celery] Pending alert already exists "
                    f"for maintenance #{record.id}"
                )

                continue

            # =====================================================
            # 1. MAINTENANCE TOMORROW
            # =====================================================

            if (
                scheduled_date
                and scheduled_date == tomorrow
            ):

                print(
                    f"[Celery] TOMORROW maintenance found "
                    f"for maintenance #{record.id}"
                )

                alert = MaintenanceAlert(
                    vehicle_id=record.vehicle_id,
                    maintenance_id=record.id,
                    alert_message=(
                        f"UPCOMING: {record.category} "
                        f"for vehicle #{record.vehicle_id} "
                        f"is scheduled for tomorrow "
                        f"({scheduled_date})."
                    ),
                    alert_type="upcoming",
                    alert_status="Pending",
                    generated_date=now,
                    next_service_date=record.next_service_date,
                )

                db.add(alert)

                db.flush()

                _create_notification(
                    db,
                    alert,
                )

                alerts_created += 1
                notifications_created += 1

                continue

            # =====================================================
            # 2. MAINTENANCE TODAY
            # =====================================================

            if (
                scheduled_date
                and scheduled_date == today
            ):

                print(
                    f"[Celery] TODAY maintenance found "
                    f"for maintenance #{record.id}"
                )

                alert = MaintenanceAlert(
                    vehicle_id=record.vehicle_id,
                    maintenance_id=record.id,
                    alert_message=(
                        f"MAINTENANCE DUE TODAY: "
                        f"{record.category} for vehicle "
                        f"#{record.vehicle_id} is scheduled "
                        f"for today."
                    ),
                    alert_type="service_due",
                    alert_status="Pending",
                    generated_date=now,
                    next_service_date=record.next_service_date,
                )

                db.add(alert)

                db.flush()

                _create_notification(
                    db,
                    alert,
                )

                alerts_created += 1
                notifications_created += 1

                continue

            # =====================================================
            # 3. OVERDUE
            # =====================================================

            if (
                scheduled_date
                and scheduled_date < today
            ):

                days_overdue = (
                    today - scheduled_date
                ).days

                print(
                    f"[Celery] OVERDUE maintenance found "
                    f"for maintenance #{record.id}"
                )

                alert = MaintenanceAlert(
                    vehicle_id=record.vehicle_id,
                    maintenance_id=record.id,
                    alert_message=(
                        f"OVERDUE: {record.category} "
                        f"for vehicle #{record.vehicle_id} "
                        f"is {days_overdue} day(s) overdue. "
                        f"Originally scheduled on "
                        f"{scheduled_date}."
                    ),
                    alert_type="overdue",
                    alert_status="Pending",
                    generated_date=now,
                    next_service_date=record.next_service_date,
                )

                db.add(alert)

                db.flush()

                _create_notification(
                    db,
                    alert,
                )

                alerts_created += 1
                notifications_created += 1

                continue

            # =====================================================
            # 4. NEXT SERVICE WITHIN REMINDER WINDOW
            # =====================================================

            if (
                next_service_date
                and today
                <= next_service_date
                <= reminder_cutoff
            ):

                days_left = (
                    next_service_date - today
                ).days

                print(
                    f"[Celery] NEXT SERVICE reminder found "
                    f"for maintenance #{record.id}"
                )

                alert = MaintenanceAlert(
                    vehicle_id=record.vehicle_id,
                    maintenance_id=record.id,
                    alert_message=(
                        f"SERVICE DUE: {record.category} "
                        f"for vehicle #{record.vehicle_id} "
                        f"is due in {days_left} day(s) "
                        f"(on {next_service_date})."
                    ),
                    alert_type="service_due",
                    alert_status="Pending",
                    generated_date=now,
                    next_service_date=record.next_service_date,
                )

                db.add(alert)

                db.flush()

                _create_notification(
                    db,
                    alert,
                )

                alerts_created += 1
                notifications_created += 1

                continue

            print(
                f"[Celery] No alert condition matched "
                f"for maintenance #{record.id}"
            )

        # ---------------------------------------------------------
        # COMMIT
        # ---------------------------------------------------------

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

        print(
            f"[Celery] check_maintenance_schedules FAILED: {exc}"
        )

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

    return (
        check_maintenance_schedules
        .apply()
        .get()
    )