"""Maintenance CRUD router — Tasks 3, 4, 5.

Endpoints
---------
POST   /maintenance            Create a maintenance record
GET    /maintenance            List all records (filter: vehicle_id, status, category)
GET    /maintenance/{id}       Get a single record
PUT    /maintenance/{id}       Update a record (also updates Vehicle.current_status)
DELETE /maintenance/{id}       SOFT-delete: sets status=CANCELLED, never destroys history

Task 5: When a maintenance record becomes IN_PROGRESS → Vehicle.current_status = MAINTENANCE.
        When COMPLETED or CANCELLED     → Vehicle.current_status = AVAILABLE.

Task 6: All validation errors return HTTP 422; bad vehicle IDs return HTTP 404.
"""

import logging
from datetime import date as DateType
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import MaintenanceCategoryEnum, MaintenanceStatusEnum, VehicleStatusEnum
from app.models.maintenance import MaintenanceRecord
from app.models.vehicle import Vehicle
from app.services.security import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class MaintenanceCreate(BaseModel):
    vehicle_id:       int
    category:         MaintenanceCategoryEnum
    service_date:     DateType
    next_service_date: Optional[DateType]       = None
    service_cost:     Optional[float]           = Field(None, ge=0)
    service_provider: Optional[str]             = Field(None, max_length=255)
    status:           MaintenanceStatusEnum     = MaintenanceStatusEnum.SCHEDULED
    notes:            Optional[str]             = None


class MaintenanceUpdate(BaseModel):
    category:         Optional[MaintenanceCategoryEnum] = None
    service_date:     Optional[DateType]                = None
    next_service_date: Optional[DateType]               = None
    service_cost:     Optional[float]                   = Field(None, ge=0)
    service_provider: Optional[str]                     = Field(None, max_length=255)
    status:           Optional[MaintenanceStatusEnum]   = None
    notes:            Optional[str]                     = None


class MaintenanceResponse(BaseModel):
    id:               int
    vehicle_id:       int
    category:         MaintenanceCategoryEnum
    service_date:     DateType
    next_service_date: Optional[DateType]
    service_cost:     Optional[float]
    service_provider: Optional[str]
    status:           MaintenanceStatusEnum
    notes:            Optional[str]
    created_at:       str

    # Vehicle summary
    vehicle_registration: Optional[str] = None
    vehicle_type:         Optional[str] = None

    model_config = {"from_attributes": True}


def _to_response(record: MaintenanceRecord) -> MaintenanceResponse:
    return MaintenanceResponse(
        id=record.id,
        vehicle_id=record.vehicle_id,
        category=record.category,
        service_date=record.service_date,
        next_service_date=record.next_service_date,
        service_cost=record.service_cost,
        service_provider=record.service_provider,
        status=record.status,
        notes=record.notes,
        created_at=record.created_at.isoformat(),
        vehicle_registration=record.vehicle.registration_number if record.vehicle else None,
        vehicle_type=record.vehicle.vehicle_type         if record.vehicle else None,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Task 5 helper: sync Vehicle.current_status based on maintenance status
# ─────────────────────────────────────────────────────────────────────────────

def _sync_vehicle_status(vehicle: Vehicle, new_maint_status: MaintenanceStatusEnum, db: Session) -> None:
    """Update the vehicle's operational status to reflect its maintenance state.

    Rules:
      IN_PROGRESS  → MAINTENANCE  (vehicle is off the road)
      COMPLETED    → AVAILABLE    (maintenance done, back on road)
      CANCELLED    → AVAILABLE    (job cancelled, assume vehicle is free)
      SCHEDULED    → no change    (just planned, vehicle still operational)
    """
    if new_maint_status == MaintenanceStatusEnum.IN_PROGRESS:
        vehicle.current_status = VehicleStatusEnum.MAINTENANCE
    elif new_maint_status in (MaintenanceStatusEnum.COMPLETED, MaintenanceStatusEnum.CANCELLED):
        vehicle.current_status = VehicleStatusEnum.AVAILABLE
    db.flush()
    logger.info(
        "Vehicle id=%s status → %s (triggered by maintenance status=%s)",
        vehicle.id, vehicle.current_status.value, new_maint_status.value,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /maintenance — Create (Task 3)
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=MaintenanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a maintenance record",
)
def create_maintenance(
    body: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Task 4: Validate vehicle exists
    vehicle = db.get(Vehicle, body.vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle id={body.vehicle_id} not found.",
        )

    record = MaintenanceRecord(
        vehicle_id=body.vehicle_id,
        category=body.category,
        service_date=body.service_date,
        next_service_date=body.next_service_date,
        service_cost=body.service_cost,
        service_provider=body.service_provider,
        status=body.status,
        notes=body.notes,
    )
    db.add(record)
    db.flush()  # get record.id before sync

    # Task 5: Update vehicle status
    _sync_vehicle_status(vehicle, body.status, db)

    db.commit()
    db.refresh(record)
    logger.info("Maintenance record id=%s created for vehicle id=%s", record.id, vehicle.id)
    return _to_response(record)


# ─────────────────────────────────────────────────────────────────────────────
# GET /maintenance — List all (Task 3)
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[MaintenanceResponse],
    summary="List all maintenance records",
)
def list_maintenance(
    vehicle_id: Optional[int]                    = Query(None, description="Filter by vehicle"),
    status_filter: Optional[MaintenanceStatusEnum] = Query(None, alias="status", description="Filter by status"),
    category: Optional[MaintenanceCategoryEnum]  = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(MaintenanceRecord)
    if vehicle_id is not None:
        q = q.filter(MaintenanceRecord.vehicle_id == vehicle_id)
    if status_filter is not None:
        q = q.filter(MaintenanceRecord.status == status_filter)
    if category is not None:
        q = q.filter(MaintenanceRecord.category == category)
    records = q.order_by(MaintenanceRecord.service_date.desc()).all()
    return [_to_response(r) for r in records]


# ─────────────────────────────────────────────────────────────────────────────
# GET /maintenance/{id} — Get single record (Task 3)
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{record_id}",
    response_model=MaintenanceResponse,
    summary="Get a maintenance record by ID",
)
def get_maintenance(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.get(MaintenanceRecord, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Maintenance record id={record_id} not found.")
    return _to_response(record)


# ─────────────────────────────────────────────────────────────────────────────
# PUT /maintenance/{id} — Update (Task 3 & 5)
# ─────────────────────────────────────────────────────────────────────────────

@router.put(
    "/{record_id}",
    response_model=MaintenanceResponse,
    summary="Update a maintenance record (also updates vehicle status)",
)
def update_maintenance(
    record_id: int,
    body: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.get(MaintenanceRecord, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Maintenance record id={record_id} not found.")

    update_data = body.model_dump(exclude_unset=True)
    new_status = update_data.get("status")

    for field, value in update_data.items():
        setattr(record, field, value)

    # Task 5: Sync vehicle status whenever maintenance status changes
    if new_status is not None:
        _sync_vehicle_status(record.vehicle, new_status, db)

    db.commit()
    db.refresh(record)
    logger.info("Maintenance record id=%s updated", record_id)
    return _to_response(record)


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /maintenance/{id} — Soft delete: NEVER erase history (Task 3 & spec)
# ─────────────────────────────────────────────────────────────────────────────

@router.delete(
    "/{record_id}",
    summary="Soft-cancel a maintenance record (history is preserved)",
    status_code=status.HTTP_200_OK,
)
def cancel_maintenance(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Maintenance history is NEVER deleted.

    This endpoint soft-cancels the record (status → CANCELLED) and
    restores the vehicle to AVAILABLE. The DB row is preserved forever.
    """
    record = db.get(MaintenanceRecord, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Maintenance record id={record_id} not found.")

    if record.status == MaintenanceStatusEnum.CANCELLED:
        return {"detail": f"Maintenance record id={record_id} is already cancelled."}

    record.status = MaintenanceStatusEnum.CANCELLED
    _sync_vehicle_status(record.vehicle, MaintenanceStatusEnum.CANCELLED, db)

    db.commit()
    logger.info("Maintenance record id=%s soft-cancelled (history preserved)", record_id)
    return {
        "detail": f"Maintenance record id={record_id} cancelled. History preserved.",
        "vehicle_status": record.vehicle.current_status.value,
    }
