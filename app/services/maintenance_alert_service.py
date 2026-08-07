from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.maintenance_alert import MaintenanceAlert
from app.models.maintenance import Maintenance
from app.services.notification_service import create_notification


def generate_alert_for_maintenance(maintenance_id: int, db: Session):

    maintenance = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    # Task 2 — do not generate alerts for completed maintenance
    if maintenance.maintenance_status.lower() == "completed":
        raise HTTPException(
            status_code=400,
            detail="Cannot generate an alert for a completed maintenance record."
        )

    # Task 2 — prevent duplicate active alerts for the same maintenance record
    existing_alert = (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.maintenance_id == maintenance_id,
            MaintenanceAlert.alert_status == "Active"
        )
        .first()
    )
    if existing_alert:
        raise HTTPException(
            status_code=400,
            detail="An active alert already exists for this maintenance record."
        )

    new_alert = MaintenanceAlert(
        vehicle_id=maintenance.vehicle_id,
        maintenance_id=maintenance.id,
        alert_message=f"Maintenance due: {maintenance.maintenance_category} for vehicle #{maintenance.vehicle_id}",
        alert_status="Active",
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


def get_all_alerts(db: Session):
    return db.query(MaintenanceAlert).all()


def resolve_alert(alert_id: int, db: Session):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.alert_status = "Resolved"
    db.commit()
    db.refresh(alert)

    return alert