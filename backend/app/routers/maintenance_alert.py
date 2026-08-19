from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MaintenanceAlert, Vehicle, Maintenance
from app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertResponse,
    MaintenanceAlertUpdate
)

from app.dependencies import (
    fleet_manager_required,
    driver_view_required
)

from app.tasks import check_maintenance_schedule


router = APIRouter(
    prefix="/maintenance-alerts",
    tags=["Maintenance Alerts"]
)


# ============================================================
# CREATE ALERT
# Administrator / Fleet Manager
# ============================================================

@router.post(
    "/",
    response_model=MaintenanceAlertResponse
)
def create_alert(
    alert: MaintenanceAlertCreate,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    # Validate Vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == alert.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Validate Maintenance
    maintenance = db.query(Maintenance).filter(
        Maintenance.maintenance_id == alert.maintenance_id
    ).first()

    if not maintenance:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    # Prevent duplicate alerts
    duplicate = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.vehicle_id == alert.vehicle_id,
        MaintenanceAlert.maintenance_id == alert.maintenance_id,
        MaintenanceAlert.alert_type == alert.alert_type
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="Duplicate maintenance alert already exists"
        )

    # Create Alert
    new_alert = MaintenanceAlert(
        **alert.dict()
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return new_alert


# ============================================================
# GET ALL ALERTS
# Administrator / Fleet Manager / Dispatcher / Driver
# ============================================================

@router.get(
    "/",
    response_model=list[MaintenanceAlertResponse]
)
def get_all_alerts(
    user=Depends(driver_view_required),
    db: Session = Depends(get_db)
):

    return db.query(MaintenanceAlert).all()


# ============================================================
# TEST CELERY
# Administrator / Fleet Manager
# ============================================================

@router.get("/test-celery")
def test_celery(
    user=Depends(fleet_manager_required)
):

    check_maintenance_schedule.delay()

    return {
        "message": "Task sent to Celery"
    }


# ============================================================
# GET ALERT BY ID
# Administrator / Fleet Manager / Dispatcher / Driver
# ============================================================

@router.get(
    "/{alert_id}",
    response_model=MaintenanceAlertResponse
)
def get_alert(
    alert_id: int,
    user=Depends(driver_view_required),
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


# ============================================================
# UPDATE ALERT
# Administrator / Fleet Manager
# ============================================================

@router.put(
    "/{alert_id}",
    response_model=MaintenanceAlertResponse
)
def update_alert_status(
    alert_id: int,
    alert: MaintenanceAlertUpdate,
    user=Depends(fleet_manager_required),
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


# ============================================================
# DELETE ALERT
# Administrator / Fleet Manager
# ============================================================

@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    user=Depends(fleet_manager_required),
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