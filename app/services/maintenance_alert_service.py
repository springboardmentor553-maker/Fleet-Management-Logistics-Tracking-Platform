from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.maintenance_alert import MaintenanceAlert
from app.models.maintenance import Maintenance
from app.schemas.maintenance_alert import MaintenanceAlertUpdate
from app.services.notification_service import create_notification


# =====================================
# Create Alert
# =====================================

def generate_alert_for_maintenance(maintenance_id: int, db: Session):

    maintenance = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    if maintenance.maintenance_status.lower() == "completed":
        raise HTTPException(
            status_code=400,
            detail="Cannot generate an alert for a completed maintenance record."
        )

    # Prevent duplicate pending alerts for the same maintenance schedule
    existing_alert = (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.maintenance_id == maintenance_id,
            MaintenanceAlert.alert_status == "Pending"
        )
        .first()
    )
    if existing_alert:
        raise HTTPException(
            status_code=400,
            detail="A pending alert already exists for this maintenance record."
        )

    new_alert = MaintenanceAlert(
        vehicle_id=maintenance.vehicle_id,
        maintenance_id=maintenance.id,
        alert_message=f"Maintenance due: {maintenance.maintenance_category} for vehicle #{maintenance.vehicle_id}",
        alert_type="Reminder",
        alert_status="Pending",
        next_service_date=maintenance.next_service_date,
    )

    db.add(new_alert)

    create_notification(
        db=db,
        title="Maintenance Alert",
        message=new_alert.alert_message,
        type="warning"
    )

    db.commit()
    db.refresh(new_alert)

    return new_alert


# =====================================
# Get All Alerts
# =====================================

def get_all_alerts(db: Session):
    return db.query(MaintenanceAlert).all()


# =====================================
# Get Alert by ID
# =====================================

def get_alert(alert_id: int, db: Session):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


# =====================================
# Update Alert Status
# =====================================

def update_alert_status(alert_id: int, update: MaintenanceAlertUpdate, db: Session):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.alert_status = update.alert_status

    db.commit()
    db.refresh(alert)

    return alert


# =====================================
# Delete Alert
# =====================================

def delete_alert(alert_id: int, db: Session):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()

    return {"message": "Alert deleted successfully"}