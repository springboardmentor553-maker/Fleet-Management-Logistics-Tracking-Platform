"""Maintenance Alert CRUD router — Task 2.

Endpoints
---------
POST   /maintenance-alerts            Create an alert
GET    /maintenance-alerts            List all alerts (filter: vehicle_id, status, alert_type)
GET    /maintenance-alerts/{id}       Get a single alert
PUT    /maintenance-alerts/{id}       Update alert status
DELETE /maintenance-alerts/{id}       Delete an alert

Validation:
  - Vehicle must exist.
  - Maintenance record must exist.
  - Prevent duplicate PENDING alerts for the same maintenance record.
"""

import logging
from datetime import date as DateType, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import AlertStatusEnum
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.models.vehicle import Vehicle
from app.services.security import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    vehicle_id: int
    maintenance_id: int
    alert_message: str = Field(..., max_length=255)
    alert_type: str = Field(..., max_length=50)
    next_service_date: DateType


class AlertStatusUpdate(BaseModel):
    status: AlertStatusEnum


class AlertResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_id: int
    alert_message: str
    alert_type: str
    status: AlertStatusEnum
    generated_date: str
    next_service_date: DateType

    # Denormalised summaries for the frontend
    vehicle_registration: Optional[str] = None
    maintenance_category: Optional[str] = None

    model_config = {"from_attributes": True}


def _to_response(alert: MaintenanceAlert) -> AlertResponse:
    return AlertResponse(
        id=alert.id,
        vehicle_id=alert.vehicle_id,
        maintenance_id=alert.maintenance_id,
        alert_message=alert.alert_message,
        alert_type=alert.alert_type,
        status=alert.status,
        generated_date=alert.generated_date.isoformat() if alert.generated_date else "",
        next_service_date=alert.next_service_date,
        vehicle_registration=(
            alert.vehicle.registration_number if alert.vehicle else None
        ),
        maintenance_category=(
            alert.maintenance.category.value if alert.maintenance else None
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /maintenance-alerts — Create alert
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a maintenance alert",
)
def create_alert(
    body: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate vehicle exists
    vehicle = db.get(Vehicle, body.vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle id={body.vehicle_id} not found.",
        )

    # Validate maintenance record exists
    maintenance = db.get(MaintenanceRecord, body.maintenance_id)
    if maintenance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record id={body.maintenance_id} not found.",
        )

    # Prevent duplicate PENDING alerts for the same maintenance schedule
    existing = (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.maintenance_id == body.maintenance_id,
            MaintenanceAlert.status == AlertStatusEnum.PENDING,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"A pending alert already exists for maintenance record "
                f"id={body.maintenance_id} (alert id={existing.id})."
            ),
        )

    alert = MaintenanceAlert(
        vehicle_id=body.vehicle_id,
        maintenance_id=body.maintenance_id,
        alert_message=body.alert_message,
        alert_type=body.alert_type,
        next_service_date=body.next_service_date,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    logger.info(
        "MaintenanceAlert id=%s created for vehicle id=%s, maintenance id=%s",
        alert.id, body.vehicle_id, body.maintenance_id,
    )
    return _to_response(alert)


# ─────────────────────────────────────────────────────────────────────────────
# GET /maintenance-alerts — List all
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[AlertResponse],
    summary="List all maintenance alerts",
)
def list_alerts(
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle"),
    status_filter: Optional[AlertStatusEnum] = Query(None, alias="status", description="Filter by status"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(MaintenanceAlert)
    if vehicle_id is not None:
        q = q.filter(MaintenanceAlert.vehicle_id == vehicle_id)
    if status_filter is not None:
        q = q.filter(MaintenanceAlert.status == status_filter)
    if alert_type is not None:
        q = q.filter(MaintenanceAlert.alert_type == alert_type)
    alerts = q.order_by(MaintenanceAlert.generated_date.desc()).all()
    return [_to_response(a) for a in alerts]


# ─────────────────────────────────────────────────────────────────────────────
# GET /maintenance-alerts/{id} — Get single alert
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{alert_id}",
    response_model=AlertResponse,
    summary="Get a maintenance alert by ID",
)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.get(MaintenanceAlert, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance alert id={alert_id} not found.",
        )
    return _to_response(alert)


# ─────────────────────────────────────────────────────────────────────────────
# PUT /maintenance-alerts/{id} — Update alert status
# ─────────────────────────────────────────────────────────────────────────────

@router.put(
    "/{alert_id}",
    response_model=AlertResponse,
    summary="Update a maintenance alert status",
)
def update_alert_status(
    alert_id: int,
    body: AlertStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.get(MaintenanceAlert, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance alert id={alert_id} not found.",
        )

    alert.status = body.status
    db.commit()
    db.refresh(alert)
    logger.info("MaintenanceAlert id=%s status updated to %s", alert_id, body.status.value)
    return _to_response(alert)


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /maintenance-alerts/{id} — Delete alert
# ─────────────────────────────────────────────────────────────────────────────

@router.delete(
    "/{alert_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a maintenance alert",
)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.get(MaintenanceAlert, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance alert id={alert_id} not found.",
        )

    db.delete(alert)
    db.commit()
    logger.info("MaintenanceAlert id=%s deleted", alert_id)
    return {"detail": f"Maintenance alert id={alert_id} deleted."}
