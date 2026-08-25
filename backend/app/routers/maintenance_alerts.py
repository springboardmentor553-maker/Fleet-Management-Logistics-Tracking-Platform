from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role

router = APIRouter(prefix="/maintenance-alerts", tags=["Maintenance Alerts"])

VALID_ALERT_STATUSES = ["pending", "sent", "completed"]


@router.post("/", response_model=schemas.MaintenanceAlertResponse)
def create_alert(
    alert: schemas.MaintenanceAlertCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "fleet_manager")),
):
    """
    Task 2 — Create Alert (manual creation, separate from the automatic
    Celery-generated ones). Validates vehicle + maintenance record exist,
    and prevents duplicate PENDING alerts for the same maintenance schedule.
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == alert.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    maintenance = db.query(models.Maintenance).filter(models.Maintenance.id == alert.maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")

    existing_pending = (
        db.query(models.MaintenanceAlert)
        .filter(
            models.MaintenanceAlert.maintenance_id == alert.maintenance_id,
            models.MaintenanceAlert.status == "pending",
        )
        .first()
    )
    if existing_pending:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="A pending alert already exists for this maintenance schedule",
        )

    new_alert = models.MaintenanceAlert(
        vehicle_id=alert.vehicle_id,
        maintenance_id=alert.maintenance_id,
        alert_type=alert.alert_type,
        message=alert.message,
        next_service_date=alert.next_service_date,
        status="pending",
        is_read=False,
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


@router.get("/", response_model=list[schemas.MaintenanceAlertResponse])
def list_alerts(
    is_read: Optional[bool] = None,
    status_filter: Optional[str] = None,
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.MaintenanceAlert)
    if is_read is not None:
        query = query.filter(models.MaintenanceAlert.is_read == is_read)
    if status_filter is not None:
        query = query.filter(models.MaintenanceAlert.status == status_filter)
    if vehicle_id is not None:
        query = query.filter(models.MaintenanceAlert.vehicle_id == vehicle_id)
    return query.order_by(models.MaintenanceAlert.created_at.desc()).all()


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db)):
    count = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.is_read == False).count()  # noqa: E712
    return {"unread_count": count}


@router.get("/{alert_id}", response_model=schemas.MaintenanceAlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.put("/{alert_id}/read", response_model=schemas.MaintenanceAlertResponse)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    """Existing endpoint — used by the Notifications UI (unread badge, bell dropdown)."""
    alert = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/{alert_id}/status", response_model=schemas.MaintenanceAlertResponse)
def update_alert_status(alert_id: int, update: schemas.MaintenanceAlertStatusUpdate, db: Session = Depends(get_db)):
    """
    Task 2 — Update Alert Status (the 3-state Pending/Sent/Completed lifecycle).
    Separate from /read, which only toggles the UI unread-badge boolean.
    """
    alert = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Alert not found")

    if update.status not in VALID_ALERT_STATUSES:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {VALID_ALERT_STATUSES}")

    alert.status = update.status
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    updated = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.is_read == False).update({"is_read": True})  # noqa: E712
    db.commit()
    return {"message": f"{updated} alert(s) marked as read"}


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "fleet_manager")),
):
    alert = db.query(models.MaintenanceAlert).filter(models.MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}