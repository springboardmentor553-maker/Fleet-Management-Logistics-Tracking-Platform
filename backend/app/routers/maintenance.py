from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models.maintenance import Maintenance
from backend.app.models.vehicle import Vehicle
from backend.app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)


def update_vehicle_status_if_needed(db: Session, vehicle_id: int, maintenance_status: str):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        return
    if maintenance_status == "In Progress":
        vehicle.status = "Maintenance"
    elif maintenance_status in ["Completed", "Cancelled"]:
        # Verify if vehicle has any other active maintenance records in progress
        other_active = db.query(Maintenance).filter(
            (Maintenance.vehicle_id == vehicle_id) &
            (Maintenance.maintenance_status == "In Progress")
        ).first()
        if not other_active:
            vehicle.status = "Available"
    db.commit()


@router.post("/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance(
    payload: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):
    # Verify vehicle_id exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle Not Found")

    new_record = Maintenance(
        vehicle_id=payload.vehicle_id,
        maintenance_category=payload.maintenance_category,
        service_date=payload.service_date,
        next_service_date=payload.next_service_date,
        service_cost=payload.service_cost,
        service_provider=payload.service_provider,
        maintenance_status=payload.maintenance_status,
        notes=payload.notes
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    update_vehicle_status_if_needed(db, payload.vehicle_id, payload.maintenance_status)

    return new_record


@router.get("/", response_model=List[MaintenanceResponse])
def get_all_maintenance(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher", "Driver"]))
):
    return db.query(Maintenance).all()


@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_maintenance_by_id(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher", "Driver"]))
):
    record = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance Record Not Found")
    return record


@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance(
    maintenance_id: int,
    payload: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):
    record = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance Record Not Found")

    # If vehicle_id is changing, validate new vehicle exists
    if payload.vehicle_id is not None and payload.vehicle_id != record.vehicle_id:
        new_vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
        if not new_vehicle:
            raise HTTPException(status_code=404, detail="Vehicle Not Found")
        record.vehicle_id = payload.vehicle_id

    # Apply other fields if provided
    if payload.maintenance_category is not None:
        record.maintenance_category = payload.maintenance_category
    if payload.service_date is not None:
        record.service_date = payload.service_date
    if payload.next_service_date is not None:
        record.next_service_date = payload.next_service_date
    if payload.service_cost is not None:
        record.service_cost = payload.service_cost
    if payload.service_provider is not None:
        record.service_provider = payload.service_provider
    if payload.maintenance_status is not None:
        record.maintenance_status = payload.maintenance_status
    if payload.notes is not None:
        record.notes = payload.notes

    db.commit()
    db.refresh(record)

    update_vehicle_status_if_needed(db, record.vehicle_id, record.maintenance_status)

    return record


@router.delete("/{maintenance_id}")
def delete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):
    record = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance Record Not Found")

    # Block completed maintenance history record deletion
    if record.maintenance_status == "Completed":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete completed maintenance history records."
        )

    vehicle_id = record.vehicle_id
    db.delete(record)
    db.commit()

    # Re-evaluate vehicle status
    update_vehicle_status_if_needed(db, vehicle_id, "Cancelled")

    return {"message": "Maintenance record deleted successfully"}
