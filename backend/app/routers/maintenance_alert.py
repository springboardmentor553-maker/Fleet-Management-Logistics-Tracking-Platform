from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models.maintenance_alert import MaintenanceAlert
from backend.app.models.vehicle import Vehicle
from backend.app.models.maintenance import Maintenance
from backend.app.schemas.maintenance_alert import (
    MaintenanceAlertCreate,
    MaintenanceAlertUpdate,
    MaintenanceAlertResponse,
)
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/maintenance-alerts",
    tags=["Maintenance Alerts"],
)

WRITE_ROLES = ["Admin", "Fleet Manager"]
READ_ROLES = ["Admin", "Fleet Manager", "Dispatcher"]
DELETE_ROLES = ["Admin"]


def _get_vehicle_or_404(db: Session, vehicle_id: int):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle Not Found")
    return vehicle


def _get_maintenance_or_404(db: Session, maintenance_id: int):
    m = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance Record Not Found")
    return m


def _check_duplicate_pending_alert(db: Session, maintenance_id: int, exclude_id: int = None):
    query = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.maintenance_id == maintenance_id,
        MaintenanceAlert.alert_status == "Pending"
    )
    if exclude_id is not None:
        query = query.filter(MaintenanceAlert.id != exclude_id)
    dup = query.first()
    if dup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pending alert already exists for this maintenance schedule"
        )


# ── POST ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=MaintenanceAlertResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_alert(
    payload: MaintenanceAlertCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(WRITE_ROLES)),
):
    """Create a new maintenance alert."""
    _get_vehicle_or_404(db, payload.vehicle_id)
    _get_maintenance_or_404(db, payload.maintenance_id)
    if payload.alert_status == "Pending":
        _check_duplicate_pending_alert(db, payload.maintenance_id)

    record = MaintenanceAlert(
        vehicle_id=payload.vehicle_id,
        maintenance_id=payload.maintenance_id,
        alert_message=payload.alert_message,
        alert_type=payload.alert_type,
        alert_status=payload.alert_status,
        next_service_date=payload.next_service_date,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── GET ALL ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[MaintenanceAlertResponse])
def get_all_maintenance_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(READ_ROLES)),
):
    """Return all maintenance alerts."""
    return db.query(MaintenanceAlert).all()


# ── GET ONE ───────────────────────────────────────────────────────────────────

@router.get("/{id}", response_model=MaintenanceAlertResponse)
def get_maintenance_alert_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(READ_ROLES)),
):
    """Return a single maintenance alert by ID."""
    record = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance Alert Not Found")
    return record


# ── PUT ───────────────────────────────────────────────────────────────────────

@router.put("/{id}", response_model=MaintenanceAlertResponse)
def update_maintenance_alert(
    id: int,
    payload: MaintenanceAlertUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(WRITE_ROLES)),
):
    """Update an existing maintenance alert."""
    record = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance Alert Not Found")

    # If vehicle_id is changing, validate it exists
    if payload.vehicle_id is not None:
        _get_vehicle_or_404(db, payload.vehicle_id)
        record.vehicle_id = payload.vehicle_id

    # Check maintenance_id changes or status changes to Pending
    target_m_id = payload.maintenance_id if payload.maintenance_id is not None else record.maintenance_id
    target_status = payload.alert_status if payload.alert_status is not None else record.alert_status

    # Validate maintenance record exists if it is changing
    if payload.maintenance_id is not None:
        _get_maintenance_or_404(db, payload.maintenance_id)
        record.maintenance_id = payload.maintenance_id

    if target_status == "Pending":
        _check_duplicate_pending_alert(db, target_m_id, exclude_id=id)

    if payload.alert_message is not None:
        record.alert_message = payload.alert_message
    if payload.alert_type is not None:
        record.alert_type = payload.alert_type
    if payload.alert_status is not None:
        record.alert_status = payload.alert_status
    if payload.next_service_date is not None:
        record.next_service_date = payload.next_service_date

    db.commit()
    db.refresh(record)
    return record


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_maintenance_alert(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(DELETE_ROLES)),
):
    """Delete a maintenance alert."""
    record = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance Alert Not Found")

    db.delete(record)
    db.commit()
    return {"message": "Maintenance alert deleted successfully"}
