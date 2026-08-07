from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance import Maintenance
from app.models.maintenance_alert import MaintenanceAlert
from app.models.maintenance_alert_enum import AlertStatus
from app.models.vehicle import Vehicle
from app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertResponse,
    MaintenanceAlertUpdate,
)

router = APIRouter(
    prefix="/maintenance-alerts",
    tags=["Maintenance Alerts"],
)
@router.post("/", response_model=MaintenanceAlertResponse)
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

    duplicate = (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.maintenance_id == alert.maintenance_id,
            MaintenanceAlert.alert_status == AlertStatus.PENDING
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="Pending alert already exists for this maintenance record."
        )

    new_alert = MaintenanceAlert(
        vehicle_id=alert.vehicle_id,
        maintenance_id=alert.maintenance_id,
        alert_message=alert.alert_message,
        alert_type=alert.alert_type,
        alert_status=AlertStatus.PENDING,
        generated_date=date.today(),
        next_service_date=alert.next_service_date
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return new_alert
@router.get("/", response_model=list[MaintenanceAlertResponse])
def get_all_alerts(
    db: Session = Depends(get_db)
):
    return db.query(MaintenanceAlert).all()
@router.get("/{alert_id}", response_model=MaintenanceAlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):

    alert = (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return alert
@router.put("/{alert_id}", response_model=MaintenanceAlertResponse)
def update_alert_status(
    alert_id: int,
    update: MaintenanceAlertUpdate,
    db: Session = Depends(get_db)
):

    alert = (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert.alert_status = update.alert_status

    db.commit()
    db.refresh(alert)

    return alert
@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):

    alert = (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    db.delete(alert)
    db.commit()

    return {
        "message": "Maintenance alert deleted successfully."
    }