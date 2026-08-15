from datetime import datetime, timedelta, timezone
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.maintenance import Maintenance, MaintenanceStatus
from app.utils.task_logger import log_task_execution, task_logger

@celery_app.task
@log_task_execution("maintenance_reminder")
def check_maintenance_reminders():
    """
    Daily task to check maintenance records.
    If next_service_date <= today + 7 days, generate a reminder.
    If overdue, generate an overdue alert.
    """
    db = SessionLocal()
    try:
        today = datetime.now(timezone.utc)
        target_date = today + timedelta(days=7)
        
        upcoming = db.query(Maintenance).filter(
            Maintenance.maintenance_status == MaintenanceStatus.SCHEDULED,
            Maintenance.next_service_date <= target_date,
            Maintenance.next_service_date >= today
        ).all()
        
        for m in upcoming:
            # Check for existing pending alert
            from app.models.maintenance_alert import MaintenanceAlert, AlertStatus
            existing = db.query(MaintenanceAlert).filter(
                MaintenanceAlert.vehicle_id == m.vehicle_id,
                MaintenanceAlert.maintenance_id == m.id,
                MaintenanceAlert.alert_status == AlertStatus.PENDING
            ).first()
            
            if not existing:
                alert = MaintenanceAlert(
                    vehicle_id=m.vehicle_id,
                    maintenance_id=m.id,
                    alert_message=f"Upcoming maintenance ({m.maintenance_category}) due on {m.next_service_date.strftime('%Y-%m-%d')}",
                    alert_type="Upcoming",
                    alert_status=AlertStatus.PENDING,
                    next_service_date=m.next_service_date
                )
                db.add(alert)
                task_logger.info(f"[REMINDER] Created alert for Vehicle {m.vehicle_id} for {m.maintenance_category}.")
            
        overdue = db.query(Maintenance).filter(
            Maintenance.maintenance_status == MaintenanceStatus.SCHEDULED,
            Maintenance.next_service_date < today
        ).all()
        
        for m in overdue:
            from app.models.maintenance_alert import MaintenanceAlert, AlertStatus
            existing = db.query(MaintenanceAlert).filter(
                MaintenanceAlert.vehicle_id == m.vehicle_id,
                MaintenanceAlert.maintenance_id == m.id,
                MaintenanceAlert.alert_status == AlertStatus.PENDING
            ).first()
            
            if not existing:
                alert = MaintenanceAlert(
                    vehicle_id=m.vehicle_id,
                    maintenance_id=m.id,
                    alert_message=f"OVERDUE maintenance ({m.maintenance_category}) was due on {m.next_service_date.strftime('%Y-%m-%d')}",
                    alert_type="Overdue",
                    alert_status=AlertStatus.PENDING,
                    next_service_date=m.next_service_date
                )
                db.add(alert)
                task_logger.warning(f"[OVERDUE] Created alert for Vehicle {m.vehicle_id} for {m.maintenance_category}!")
        
        db.commit()
    except Exception as e:
        db.rollback()
        task_logger.error(f"Error checking maintenance reminders: {e}")
        raise e
    finally:
        db.close()
    return "Checked maintenance records successfully."
