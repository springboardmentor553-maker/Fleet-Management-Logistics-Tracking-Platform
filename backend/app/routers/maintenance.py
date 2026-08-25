from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role
from app.connection_manager import manager

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

VALID_CATEGORIES = ["oil_change", "tyre_replacement", "brake_service", "engine_service", "general_inspection"]
VALID_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"]


async def sync_vehicle_maintenance_status(db: Session, vehicle_id: int, maintenance_status: str):
    """
    Keeps the vehicle's own status in sync with its maintenance record (Task 5):
    - Maintenance goes 'in_progress' -> vehicle becomes 'maintenance'
      (this also blocks the vehicle from being assigned to trips/shipments,
      since that validation already checks for vehicle.status == 'maintenance')
    - Maintenance goes 'completed'/'cancelled' -> vehicle goes back to 'available'
      (only if it was 'maintenance', so this never overrides 'in_use')
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        return

    changed = False
    if maintenance_status == "in_progress" and vehicle.status != "maintenance":
        vehicle.status = "maintenance"
        changed = True
    elif maintenance_status in ("completed", "cancelled") and vehicle.status == "maintenance":
        vehicle.status = "available"
        changed = True

    if changed:
        db.commit()
        db.refresh(vehicle)
        await manager.broadcast({
            "type": "vehicle_location_update",
            "vehicle_id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "current_lat": vehicle.current_lat,
            "current_lng": vehicle.current_lng,
            "status": vehicle.status,
        })


def validate_category_and_status(category: str, record_status: str):
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Category must be one of {VALID_CATEGORIES}")
    if record_status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {VALID_STATUSES}")


@router.post("/", response_model=schemas.MaintenanceResponse)
async def create_maintenance(record: schemas.MaintenanceCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    validate_category_and_status(record.category, record.status)

    # Task 4 — Link Maintenance with Vehicle: reject invalid vehicle IDs
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == record.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    new_record = models.Maintenance(**record.dict())
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    # Task 5 — Update Vehicle Status
    await sync_vehicle_maintenance_status(db, new_record.vehicle_id, new_record.status)

    return new_record


@router.get("/", response_model=list[schemas.MaintenanceResponse])
def list_maintenance(vehicle_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Maintenance)
    if vehicle_id is not None:
        query = query.filter(models.Maintenance.vehicle_id == vehicle_id)
    return query.order_by(models.Maintenance.service_date.desc()).all()


@router.get("/{maintenance_id}", response_model=schemas.MaintenanceResponse)
def get_maintenance(maintenance_id: int, db: Session = Depends(get_db)):
    record = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")
    return record


@router.put("/{maintenance_id}", response_model=schemas.MaintenanceResponse)
async def update_maintenance(maintenance_id: int, updated: schemas.MaintenanceCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    record = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")

    validate_category_and_status(updated.category, updated.status)

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == updated.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    for key, value in updated.dict().items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)

    await sync_vehicle_maintenance_status(db, record.vehicle_id, record.status)

    return record


@router.put("/{maintenance_id}/status", response_model=schemas.MaintenanceResponse)
async def update_maintenance_status(maintenance_id: int, update: schemas.MaintenanceStatusUpdate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    record = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")

    if update.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {VALID_STATUSES}")

    record.status = update.status
    db.commit()
    db.refresh(record)

    await sync_vehicle_maintenance_status(db, record.vehicle_id, record.status)

    return record


@router.delete("/{maintenance_id}")
def delete_maintenance(maintenance_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    record = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")

    # Business rule: "Never delete maintenance history" — a completed service
    # record is permanent history. Only records that never actually happened
    # (scheduled, in_progress, cancelled) can be removed, e.g. to fix a mistake.
    status_value = record.status.value if hasattr(record.status, "value") else record.status
    if status_value == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed maintenance records are permanent history and cannot be deleted"
        )

    db.delete(record)
    db.commit()
    return {"message": "Maintenance record deleted successfully"}