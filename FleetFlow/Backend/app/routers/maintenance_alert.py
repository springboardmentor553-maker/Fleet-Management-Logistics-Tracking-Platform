from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.models.notification import Notification
from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertUpdate,
    MaintenanceAlertResponse,
)

router = APIRouter(prefix="/maintenance-alerts", tags=["Maintenance Alerts"])

_manager_or_admin = require_roles(Role.ADMIN, Role.FLEET_MANAGER)

VALID_STATUSES = {"Pending", "Sent", "Completed"}
VALID_TYPES    = {"service_due", "overdue", "health_critical", "upcoming"}


# ─── POST /maintenance-alerts/ ────────────────────────────────────────────────
@router.post("/", response_model=MaintenanceAlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    data: MaintenanceAlertCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    # 1. Vehicle must exist
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # 2. Maintenance record must exist
    maintenance = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.id == data.maintenance_id)
        .first()
    )
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    # 3. Maintenance record must belong to the same vehicle
    if maintenance.vehicle_id != data.vehicle_id:
        raise HTTPException(
            status_code=400,
            detail="Maintenance record does not belong to the specified vehicle"
        )

    # 4. Prevent duplicate Pending alerts for the same maintenance schedule
    duplicate = (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.maintenance_id == data.maintenance_id,
            MaintenanceAlert.alert_status == "Pending",
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="A pending alert already exists for this maintenance record. "
                   "Resolve the existing alert before creating a new one."
        )

    # 5. Validate alert_type and alert_status
    if data.alert_type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid alert_type. Must be one of: {', '.join(VALID_TYPES)}"
        )
    if data.alert_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid alert_status. Must be one of: {', '.join(VALID_STATUSES)}"
        )

    alert = MaintenanceAlert(
        vehicle_id=data.vehicle_id,
        maintenance_id=data.maintenance_id,
        alert_message=data.alert_message,
        alert_type=data.alert_type,
        alert_status=data.alert_status,
        generated_date=datetime.utcnow(),
        next_service_date=data.next_service_date or maintenance.next_service_date,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
   

    notification = Notification(
        user_id=None,   # Broadcast notification
        title=f"Maintenance Alert - {vehicle.plate_number}",
        message=alert.alert_message,
        category="maintenance_alert",

        channel_email=False,
        channel_sms=False,
        channel_push=True,

        priority="normal",

        reference_id=alert.id,
        reference_type="maintenance_alert",

        created_at=datetime.utcnow(),
    )

    db.add(notification)
    db.commit()
    return alert
from app.tasks.maintenance_tasks import run_maintenance_alerts_check

# ─── POST /maintenance-alerts/generate-auto ───────────────────────────────────
@router.post("/generate-auto")
def generate_auto_alerts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Scans all active maintenance schedules and automatically generates overdue/due/upcoming alerts."""
    return run_maintenance_alerts_check(db)


# ─── GET /maintenance-alerts/ ─────────────────────────────────────────────────
@router.get("/", response_model=List[MaintenanceAlertResponse])
def get_all_alerts(
    alert_status: Optional[str] = None,
    alert_type:   Optional[str] = None,
    vehicle_id:   Optional[int] = None,
    auto_check:   bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if auto_check:
        try:
            run_maintenance_alerts_check(db)
        except Exception:
            pass

    query = db.query(MaintenanceAlert)
    if alert_status:
        query = query.filter(MaintenanceAlert.alert_status == alert_status)
    if alert_type:
        query = query.filter(MaintenanceAlert.alert_type == alert_type)
    if vehicle_id:
        query = query.filter(MaintenanceAlert.vehicle_id == vehicle_id)
    return query.order_by(MaintenanceAlert.id.desc()).all()


# ─── GET /maintenance-alerts/{alert_id} ───────────────────────────────────────
@router.get("/{alert_id}", response_model=MaintenanceAlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


# ─── PATCH /maintenance-alerts/{alert_id} ─────────────────────────────────────
@router.patch("/{alert_id}", response_model=MaintenanceAlertResponse)
def update_alert_status(
    alert_id: int,
    data: MaintenanceAlertUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if data.alert_status is not None:
        if data.alert_status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid alert_status. Must be one of: {', '.join(VALID_STATUSES)}"
            )
        alert.alert_status = data.alert_status

    if data.alert_message is not None:
        alert.alert_message = data.alert_message

    if data.alert_type is not None:
        if data.alert_type not in VALID_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid alert_type. Must be one of: {', '.join(VALID_TYPES)}"
            )
        alert.alert_type = data.alert_type

    if data.next_service_date is not None:
        alert.next_service_date = data.next_service_date

    db.commit()
    db.refresh(alert)
    return alert


# ─── DELETE /maintenance-alerts/{alert_id} ────────────────────────────────────
@router.delete("/{alert_id}", status_code=status.HTTP_200_OK)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"message": f"Alert #{alert_id} deleted successfully"}
