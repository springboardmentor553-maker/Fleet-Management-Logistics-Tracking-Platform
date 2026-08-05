from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MaintenanceAlert, Vehicle, Maintenance
from app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertResponse,
    MaintenanceAlertUpdate
)
from app.tasks import check_maintenance_schedule

router = APIRouter(
    prefix="/maintenance-alerts",
    tags=["Maintenance Alerts"]
)


# Create Alert
@router.post("/", response_model=MaintenanceAlertResponse)
def create_alert(
    alert: MaintenanceAlertCreate,
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == alert.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    maintenance = db.query(Maintenance).filter(
        Maintenance.maintenance_id == alert.maintenance_id
    ).first()

    if not maintenance:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    duplicate = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.maintenance_id == alert.maintenance_id,
        MaintenanceAlert.alert_status == "Pending"
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="Pending alert already exists"
        )

    new_alert = MaintenanceAlert(**alert.dict())

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return new_alert


# Get All Alerts
@router.get("/", response_model=list[MaintenanceAlertResponse])
def get_all_alerts(db: Session = Depends(get_db)):
    return db.query(MaintenanceAlert).all()

@router.get("/test-celery")
def test_celery():
    check_maintenance_schedule.delay()
    return {"message": "Task sent to Celery"}

# Get Alert by ID
@router.get("/{alert_id}", response_model=MaintenanceAlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):

    alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.alert_id == alert_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return alert


# Update Alert Status
@router.put("/{alert_id}", response_model=MaintenanceAlertResponse)
def update_alert_status(
    alert_id: int,
    alert: MaintenanceAlertUpdate,
    db: Session = Depends(get_db)
):

    existing = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.alert_id == alert_id
    ).first()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    existing.alert_status = alert.alert_status

    db.commit()
    db.refresh(existing)

    return existing


# Delete Alert
@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):

    alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.alert_id == alert_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    db.delete(alert)
    db.commit()

    return {
        "message": "Maintenance alert deleted successfully"
    }


