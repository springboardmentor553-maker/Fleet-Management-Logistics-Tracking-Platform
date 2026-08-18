from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas.maintenance_alerts import (
    MaintenanceAlertCreate,
    MaintenanceAlertRead,
    MaintenanceAlertUpdate,
    MaintenanceAlertUpdateStatus,
)

router = APIRouter()


@router.post("/", response_model=MaintenanceAlertRead, status_code=status.HTTP_201_CREATED)
def create_maintenance_alert(
    payload: MaintenanceAlertCreate, db: Session = Depends(get_db)
):
    """
    Task 2 - Create Maintenance Alert with validation:
    1. Vehicle must exist
    2. Maintenance record must exist
    3. Prevent duplicate pending alerts for the same maintenance schedule
    """
    # Validation 1: Vehicle must exist
    vehicle = db.get(models.Vehicle, payload.vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {payload.vehicle_id} does not exist.",
        )

    # Validation 2: Maintenance record must exist
    m_record = db.get(models.MaintenanceRecord, payload.maintenance_id)
    if not m_record or m_record.is_deleted == 1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record with ID {payload.maintenance_id} does not exist.",
        )

    # Validation 3: Prevent duplicate pending alerts for the same maintenance schedule
    if payload.alert_status.strip().title() == "Pending":
        existing_pending = (
            db.query(models.MaintenanceAlert)
            .filter(
                models.MaintenanceAlert.maintenance_id == payload.maintenance_id,
                models.MaintenanceAlert.alert_status.ilike("Pending"),
            )
            .first()
        )
        if existing_pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A pending maintenance alert already exists for maintenance schedule ID {payload.maintenance_id}.",
            )

    alert_data = payload.model_dump()
    alert_data["alert_status"] = alert_data["alert_status"].strip().title()

    alert = models.MaintenanceAlert(**alert_data)
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert


@router.get("/", response_model=List[MaintenanceAlertRead])
def get_all_maintenance_alerts(
    vehicle_id: Optional[int] = Query(None, description="Filter by Vehicle ID"),
    maintenance_id: Optional[int] = Query(None, description="Filter by Maintenance ID"),
    alert_status: Optional[str] = Query(None, description="Filter by Alert Status (Pending, Sent, Completed)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Task 2 - Get All Maintenance Alerts.
    """
    query = db.query(models.MaintenanceAlert)

    if vehicle_id is not None:
        query = query.filter(models.MaintenanceAlert.vehicle_id == vehicle_id)

    if maintenance_id is not None:
        query = query.filter(models.MaintenanceAlert.maintenance_id == maintenance_id)

    if alert_status:
        query = query.filter(models.MaintenanceAlert.alert_status.ilike(f"%{alert_status.strip()}%"))

    return query.order_by(models.MaintenanceAlert.generated_date.desc()).offset(skip).limit(limit).all()


@router.get("/{alert_id}", response_model=MaintenanceAlertRead)
def get_maintenance_alert_by_id(alert_id: int, db: Session = Depends(get_db)):
    """
    Task 2 - Get Alert by ID.
    """
    alert = db.get(models.MaintenanceAlert, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance alert with ID {alert_id} not found.",
        )
    return alert


@router.put("/{alert_id}/status", response_model=MaintenanceAlertRead)
def update_alert_status(
    alert_id: int,
    payload: MaintenanceAlertUpdateStatus,
    db: Session = Depends(get_db),
):
    """
    Task 2 - Update Alert Status (Pending, Sent, Completed).
    """
    alert = db.get(models.MaintenanceAlert, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance alert with ID {alert_id} not found.",
        )

    valid_statuses = ["Pending", "Sent", "Completed"]
    normalized_status = payload.alert_status.strip().title()
    if normalized_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid alert_status. Allowed values are: {', '.join(valid_statuses)}",
        )

    alert.alert_status = normalized_status
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/{alert_id}", response_model=MaintenanceAlertRead)
def update_maintenance_alert(
    alert_id: int,
    payload: MaintenanceAlertUpdate,
    db: Session = Depends(get_db),
):
    """
    Task 2 - Update Maintenance Alert fields.
    """
    alert = db.get(models.MaintenanceAlert, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance alert with ID {alert_id} not found.",
        )

    data = payload.model_dump(exclude_unset=True)
    if "alert_status" in data and data["alert_status"]:
        data["alert_status"] = data["alert_status"].strip().title()

    for field, value in data.items():
        setattr(alert, field, value)

    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_200_OK)
def delete_maintenance_alert(alert_id: int, db: Session = Depends(get_db)):
    """
    Task 2 - Delete Alert.
    """
    alert = db.get(models.MaintenanceAlert, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance alert with ID {alert_id} not found.",
        )

    db.delete(alert)
    db.commit()
    return {"message": f"Maintenance alert {alert_id} deleted successfully."}
