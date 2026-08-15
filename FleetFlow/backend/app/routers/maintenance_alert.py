from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertUpdate,
    MaintenanceAlertResponse
)

from app.services import maintenance_alert as alert_service

from app.auth.oauth2 import get_current_admin


router = APIRouter(
    prefix="/maintenance-alerts",
    tags=["Maintenance Alerts"]
)


@router.post(
    "/",
    response_model=MaintenanceAlertResponse
)
def create_maintenance_alert(
    alert: MaintenanceAlertCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    try:
        return alert_service.create_alert(
            db,
            alert
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=list[MaintenanceAlertResponse]
)
def get_maintenance_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return alert_service.get_all_alerts(db)


@router.get(
    "/{alert_id}",
    response_model=MaintenanceAlertResponse
)
def get_maintenance_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    alert = alert_service.get_alert_by_id(
        db,
        alert_id
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Maintenance alert not found"
        )

    return alert


@router.put(
    "/{alert_id}",
    response_model=MaintenanceAlertResponse
)
def update_maintenance_alert(
    alert_id: int,
    alert: MaintenanceAlertUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    try:
        updated = alert_service.update_alert_status(
            db,
            alert_id,
            alert
        )

        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Maintenance alert not found"
            )

        return updated

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.delete(
    "/{alert_id}"
)
def delete_maintenance_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    deleted = alert_service.delete_alert(
        db,
        alert_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Maintenance alert not found"
        )

    return {
        "message": "Maintenance alert deleted successfully"
    }