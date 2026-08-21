from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.vehicle import Vehicle
from app.models.maintenance import Maintenance
from app.models.maintenance_alert import MaintenanceAlert

from app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertUpdate
)

router = APIRouter(
    prefix="/maintenance-alerts",
    tags=["Maintenance Alerts"]
)


# ---------------------------------------
# Create Alert
# ---------------------------------------

@router.post("/")
def create_alert(
    alert: MaintenanceAlertCreate,
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == alert.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    maintenance = db.query(Maintenance).filter(
        Maintenance.id == alert.maintenance_id
    ).first()

    if not maintenance:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    duplicate = db.query(
        MaintenanceAlert
    ).filter(
        MaintenanceAlert.maintenance_id == alert.maintenance_id,
        MaintenanceAlert.alert_status == "Pending"
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="Pending alert already exists."
        )

    new_alert = MaintenanceAlert(
        vehicle_id=alert.vehicle_id,
        maintenance_id=alert.maintenance_id,
        alert_message=alert.alert_message,
        alert_type=alert.alert_type,
        alert_status="Pending",
        generated_date=alert.generated_date,
        next_service_date=alert.next_service_date
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return {
        "message": "Alert created successfully",
        "alert": new_alert
    }


# ---------------------------------------
# Get All Alerts
# ---------------------------------------

@router.get("/")
def get_all_alerts(
    db: Session = Depends(get_db)
):
    return db.query(
        MaintenanceAlert
    ).all()


# ---------------------------------------
# Get Alert By ID
# ---------------------------------------

@router.get("/{alert_id}")
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):

    alert = db.query(
        MaintenanceAlert
    ).filter(
        MaintenanceAlert.id == alert_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return alert
# ---------------------------------------
# Update Alert Status
# ---------------------------------------

@router.put("/{alert_id}")
def update_alert(
    alert_id: int,
    updated: MaintenanceAlertUpdate,
    db: Session = Depends(get_db)
):

    alert = db.query(
        MaintenanceAlert
    ).filter(
        MaintenanceAlert.id == alert_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert.alert_status = updated.alert_status

    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert updated successfully",
        "alert": alert
    }


# ---------------------------------------
# Delete Alert
# ---------------------------------------

@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):

    alert = db.query(
        MaintenanceAlert
    ).filter(
        MaintenanceAlert.id == alert_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    db.delete(alert)
    db.commit()

    return {
        "message": "Alert deleted successfully"
    }