from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas.maintenance import MaintenanceCreate, MaintenanceRead, MaintenanceUpdate

router = APIRouter()


@router.get("/categories", response_model=List[str])
def list_categories():
    """Returns predefined maintenance categories (Milestone 3 Task 2)."""
    return [category.value for category in models.MaintenanceCategory]


def update_vehicle_status_on_maintenance(db: Session, vehicle_id: int):
    """
    Task 5 - Update Vehicle Status automatically based on active maintenance.
    If vehicle has any scheduled or in-progress maintenance, set vehicle status to 'maintenance'.
    Otherwise, if vehicle is currently in 'maintenance', set status back to 'available'.
    """
    vehicle = db.get(models.Vehicle, vehicle_id)
    if not vehicle:
        return

    active_maintenance = (
        db.query(models.MaintenanceRecord)
        .filter(
            models.MaintenanceRecord.vehicle_id == vehicle_id,
            models.MaintenanceRecord.is_deleted == 0,
            models.MaintenanceRecord.status.in_(["scheduled", "in_progress", "In Progress", "Scheduled"]),
        )
        .first()
    )

    if active_maintenance:
        vehicle.status = "maintenance"
    elif vehicle.status.lower() == "maintenance":
        vehicle.status = "available"

    db.commit()
    db.refresh(vehicle)


@router.post("/", response_model=MaintenanceRead, status_code=status.HTTP_201_CREATED)
def create_maintenance_record(
    payload: MaintenanceCreate, db: Session = Depends(get_db)
):
    """
    Task 1, Task 2, Task 4 - Create Maintenance Record with vehicle existence validation.
    """
    # Task 4: Validate Vehicle ID exists
    vehicle = db.get(models.Vehicle, payload.vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {payload.vehicle_id} does not exist.",
        )

    data = payload.model_dump()
    # Map category enum value if passed as enum
    if "category" in data and hasattr(data["category"], "value"):
        data["category"] = data["category"].value

    # Default notes/description compatibility
    if not data.get("notes") and data.get("description"):
        data["notes"] = data["description"]
    elif not data.get("description") and data.get("notes"):
        data["description"] = data["notes"]

    record = models.MaintenanceRecord(**data)
    db.add(record)
    db.commit()
    db.refresh(record)

    # Task 5: Update Vehicle Status
    update_vehicle_status_on_maintenance(db, payload.vehicle_id)

    return record


@router.get("/", response_model=List[MaintenanceRead])
def get_all_maintenance_records(
    vehicle_id: Optional[int] = Query(None, description="Filter by Vehicle ID"),
    category: Optional[str] = Query(None, description="Filter by Category"),
    status: Optional[str] = Query(None, description="Filter by Status"),
    start_date: Optional[date] = Query(None, description="Filter by service start date"),
    end_date: Optional[date] = Query(None, description="Filter by service end date"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Task 3 & 4 - Get All Maintenance Records with optional filters.
    """
    query = db.query(models.MaintenanceRecord)

    if not include_deleted:
        query = query.filter(models.MaintenanceRecord.is_deleted == 0)

    if vehicle_id is not None:
        # Check vehicle existence for clearer feedback if requested
        query = query.filter(models.MaintenanceRecord.vehicle_id == vehicle_id)

    if category:
        query = query.filter(models.MaintenanceRecord.category.ilike(f"%{category}%"))

    if status:
        query = query.filter(models.MaintenanceRecord.status.ilike(f"%{status}%"))

    if start_date:
        query = query.filter(models.MaintenanceRecord.service_date >= start_date)

    if end_date:
        query = query.filter(models.MaintenanceRecord.service_date <= end_date)

    return query.order_by(models.MaintenanceRecord.service_date.desc()).offset(skip).limit(limit).all()


@router.get("/{maintenance_id}", response_model=MaintenanceRead)
def get_maintenance_record_by_id(maintenance_id: int, db: Session = Depends(get_db)):
    """
    Task 3 - Get Maintenance Record by ID.
    """
    record = db.get(models.MaintenanceRecord, maintenance_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record with ID {maintenance_id} not found",
        )
    return record


@router.put("/{maintenance_id}", response_model=MaintenanceRead)
def update_maintenance_record(
    maintenance_id: int,
    payload: MaintenanceUpdate,
    db: Session = Depends(get_db),
):
    """
    Task 3 & Task 5 - Update Maintenance Record and sync Vehicle Status.
    """
    record = db.get(models.MaintenanceRecord, maintenance_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record with ID {maintenance_id} not found",
        )

    data = payload.model_dump(exclude_unset=True)
    if "vehicle_id" in data and data["vehicle_id"] is not None:
        vehicle = db.get(models.Vehicle, data["vehicle_id"])
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {data['vehicle_id']} does not exist.",
            )

    if "category" in data and hasattr(data["category"], "value"):
        data["category"] = data["category"].value

    for field, value in data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)

    # Update Vehicle Status
    update_vehicle_status_on_maintenance(db, record.vehicle_id)

    return record


@router.delete("/{maintenance_id}", status_code=status.HTTP_200_OK)
def delete_maintenance_record(maintenance_id: int, db: Session = Depends(get_db)):
    """
    Task 3 & Mentor Requirement: "never delete maintenance history".
    Performs Soft Delete (sets is_deleted = 1) to retain historical logs.
    """
    record = db.get(models.MaintenanceRecord, maintenance_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record with ID {maintenance_id} not found",
        )

    record.is_deleted = 1
    db.commit()

    # Sync vehicle status in case active maintenance was soft deleted
    update_vehicle_status_on_maintenance(db, record.vehicle_id)

    return {"message": "Maintenance record soft-deleted successfully; history preserved."}
