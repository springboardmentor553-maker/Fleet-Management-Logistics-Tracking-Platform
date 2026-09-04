import logging
from sqlalchemy.orm import Session
from datetime import datetime

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.vehicle import Vehicle
from app.models.notification import Notification
from app.models.driver import Driver
from app.config import settings
from app.services.notification_service import notify_event, notify_driver_event

logger = logging.getLogger(__name__)


def run_low_fuel_alerts_check(db: Session) -> int:
    """
    Scans all active vehicles and evaluates remaining fuel percentage against thresholds.
    - > 30%        : Normal (auto-resolves previous unread low fuel alerts for clean recovery)
    - 20% - 30%    : Fuel Warning
    - < 20%        : Low Fuel Alert (high priority, fuel_low category)
    - < 10%        : Critical Fuel Alert (critical priority, fuel_critical category)

    Prevents duplicate unread notifications.
    """
    low_threshold = getattr(settings, "LOW_FUEL_THRESHOLD", 20.0)
    critical_threshold = getattr(settings, "CRITICAL_FUEL_THRESHOLD", 10.0)

    vehicles = db.query(Vehicle).all()
    alerts_created = 0

    for v in vehicles:
        fuel = v.fuel_level if v.fuel_level is not None else 100.0

        # 1. Recovery Scenario: Fuel > 30%
        if fuel > 30.0:
            # Resolve existing unread low/critical fuel alerts for this vehicle
            existing_alerts = (
                db.query(Notification)
                .filter(
                    Notification.reference_type == "vehicle",
                    Notification.reference_id == v.id,
                    Notification.category.in_(["fuel_low", "fuel_critical", "fuel"]),
                    Notification.is_read == False,
                )
                .all()
            )
            for alert in existing_alerts:
                alert.is_read = True
            if existing_alerts:
                try:
                    db.commit()
                except Exception:
                    db.rollback()
            continue

        # 2. Alert Trigger Scenarios: Fuel < 20%
        if fuel < low_threshold:
            is_critical = fuel < critical_threshold
            category = "fuel_critical" if is_critical else "fuel_low"
            priority = "critical" if is_critical else "high"

            if is_critical:
                title = f"🚨 Critical Fuel Alert — Vehicle {v.plate_number}"
                msg = f"Vehicle {v.plate_number} has critically low fuel ({fuel:.1f}%). Immediate refueling is required."
            else:
                title = f"⚠️ Low Fuel Alert — Vehicle {v.plate_number}"
                msg = f"Vehicle {v.plate_number} has low fuel ({fuel:.1f}%). Please refuel the vehicle."

            # DEDUPLICATION CHECK: Do not create duplicate unread alert if identical alert exists
            existing_unread = (
                db.query(Notification)
                .filter(
                    Notification.reference_type == "vehicle",
                    Notification.reference_id == v.id,
                    Notification.category == category,
                    Notification.is_read == False,
                )
                .first()
            )
            if existing_unread:
                continue

            # If switching from fuel_low to fuel_critical, resolve old fuel_low alert so critical alert takes over
            if is_critical:
                old_low_alerts = (
                    db.query(Notification)
                    .filter(
                        Notification.reference_type == "vehicle",
                        Notification.reference_id == v.id,
                        Notification.category == "fuel_low",
                        Notification.is_read == False,
                    )
                    .all()
                )
                for alert in old_low_alerts:
                    alert.is_read = True
                if old_low_alerts:
                    try:
                        db.commit()
                    except Exception:
                        db.rollback()

            # Create Notification & Dispatch to Driver (if assigned) & Admin/Fleet Manager
            driver = None
            if v.assigned_driver_id:
                driver = db.query(Driver).filter(Driver.id == v.assigned_driver_id).first()
            if not driver:
                driver = db.query(Driver).filter(Driver.assigned_vehicle_id == v.id).first()
                if driver and not v.assigned_driver_id:
                    v.assigned_driver_id = driver.id
                    try:
                        db.commit()
                    except Exception:
                        db.rollback()

            if driver:
                notify_driver_event(
                    db=db,
                    driver=driver,
                    title=title,
                    message=msg,
                    category=category,
                    priority=priority,
                    reference_type="vehicle",
                    reference_id=v.id,
                    channel_email=True,
                    channel_sms=True,
                    channel_push=True,
                )
            else:
                notify_event(
                    db=db,
                    title=title,
                    message=msg,
                    category=category,
                    priority=priority,
                    reference_type="vehicle",
                    reference_id=v.id,
                    user_id=None,
                    channel_email=True,
                    channel_sms=True,
                    channel_push=True,
                )

            alerts_created += 1
            logger.info(f"⛽ [LOW FUEL ALERT GENERATED] Vehicle '{v.plate_number}' fuel level = {fuel}%, Driver: {driver.name if driver else 'Unassigned'}")

    return alerts_created


@celery_app.task(name="app.tasks.fuel_tasks.check_low_fuel_schedules")
def check_low_fuel_schedules():
    """
    Celery periodic task to check fuel levels for all vehicles.
    """
    db = SessionLocal()
    try:
        count = run_low_fuel_alerts_check(db)
        logger.info(f"⛽ Celery low fuel check complete. {count} new alert(s) generated.")
        return {"status": "success", "alerts_created": count}
    finally:
        db.close()
