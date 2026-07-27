from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.maintenance import MaintenanceRecord
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
    VehicleHealthReport,
)

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

_manager_or_admin = require_roles(Role.ADMIN, Role.FLEET_MANAGER)


@router.post("/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def schedule_maintenance(
    data: MaintenanceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    # Check vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Allow maintenance only if vehicle is available
    if vehicle.current_status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle is currently '{vehicle.current_status}'. Maintenance can only be scheduled when the vehicle is available."
        )

    # Create maintenance record
    record = MaintenanceRecord(
        vehicle_id=data.vehicle_id,
        category=data.category,
        description=data.description,
        cost=data.cost,
        status="scheduled",
        scheduled_date=data.scheduled_date or datetime.utcnow(),
        odometer_km=data.odometer_km or 0.0,
        health_score=data.health_score or 95,
        notes=data.notes,
    )

    # Change vehicle status to maintenance
    vehicle.current_status = "maintenance"

    db.add(record)
    db.commit()
    db.refresh(record)

    return record

@router.get("/", response_model=List[MaintenanceResponse])
def list_maintenance_records(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(MaintenanceRecord)
    if category:
        query = query.filter(MaintenanceRecord.category == category)
    if status:
        query = query.filter(MaintenanceRecord.status == status)
    return query.order_by(MaintenanceRecord.id.desc()).all()


@router.get("/vehicle/{vehicle_id}", response_model=List[MaintenanceResponse])
def get_vehicle_maintenance_history(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.vehicle_id == vehicle_id)
        .order_by(MaintenanceRecord.id.desc())
        .all()
    )


@router.patch("/{record_id}", response_model=MaintenanceResponse)
def update_maintenance_record(
    record_id: int,
    data: MaintenanceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")

    if data.category is not None:
        record.category = data.category
    if data.description is not None:
        record.description = data.description
    if data.cost is not None:
        record.cost = data.cost
    if data.status is not None:
        record.status = data.status
        if data.status == "completed":
            record.completed_date = datetime.utcnow()
            # Restore vehicle status to available when maintenance completes
            vehicle = db.query(Vehicle).filter(Vehicle.id == record.vehicle_id).first()
            if vehicle and vehicle.current_status == "maintenance":
                vehicle.current_status = "available"
    if data.completed_date is not None:
        record.completed_date = data.completed_date
    if data.odometer_km is not None:
        record.odometer_km = data.odometer_km
    if data.health_score is not None:
        record.health_score = data.health_score
    if data.notes is not None:
        record.notes = data.notes

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance_record(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")
    db.delete(record)
    db.commit()


@router.get("/health-reports", response_model=List[VehicleHealthReport])
def get_vehicle_health_reports(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vehicles = db.query(Vehicle).all()
    reports = []

    for v in vehicles:
        records = (
            db.query(MaintenanceRecord)
            .filter(MaintenanceRecord.vehicle_id == v.id)
            .order_by(MaintenanceRecord.id.desc())
            .all()
        )
        completed = [r for r in records if r.status == "completed"]
        pending = [r for r in records if r.status in ("scheduled", "in_progress")]

        last_date = completed[0].completed_date if completed else None
        # Default health score starts at 95 unless maintenance records indicate otherwise
        latest_score = records[0].health_score if records else 95

        alerts = []
        if latest_score < 70:
            alerts.append("Low Health Score — Engine & Brake inspection required")
        if v.current_status == "maintenance":
            alerts.append("Vehicle currently in maintenance service")
        if len(pending) > 0:
            alerts.append(f"{len(pending)} maintenance tasks pending")

        if latest_score >= 90:
            health_status = "Excellent"
        elif latest_score >= 75:
            health_status = "Good"
        elif latest_score >= 60:
            health_status = "Fair"
        else:
            health_status = "Critical Service Required"

        reports.append(
            VehicleHealthReport(
                vehicle_id=v.id,
                plate_number=v.plate_number,
                vehicle_type=v.vehicle_type,
                health_score=latest_score,
                health_status=health_status,
                last_serviced_date=last_date,
                pending_maintenance_count=len(pending),
                alerts=alerts,
            )
        )

    return reports


@router.get("/upcoming", response_model=List[MaintenanceResponse])
def upcoming_maintenance(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    today = datetime.utcnow().replace(
    hour=0,
    minute=0,
    second=0,
    microsecond=0
)
    next_seven_days = today + timedelta(days=7)

    return (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.status == "scheduled",
            MaintenanceRecord.scheduled_date >= today,
            MaintenanceRecord.scheduled_date <= next_seven_days,
        )
        .order_by(MaintenanceRecord.scheduled_date)
        .all()
    )
@router.get("/overdue", response_model=List[MaintenanceResponse])
def overdue_maintenance(
    db: Session =Depends(get_db),
    _: User = Depends(get_current_user),
):
    today = datetime.utcnow().replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    return (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.status.in_(["scheduled", "in_progress"]),
            MaintenanceRecord.scheduled_date < today,
        )
        .order_by(MaintenanceRecord.scheduled_date)
        .all()
    )

@router.patch("/{record_id}/start", response_model=MaintenanceResponse)
def start_maintenance(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    record = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.id == record_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    if record.status != "scheduled":
        raise HTTPException(
            status_code=400,
            detail="Only scheduled maintenance can be started"
        )

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == record.vehicle_id)
        .first()
    )

    record.status = "in_progress"

    if vehicle:
        vehicle.current_status = "maintenance"

    db.commit()
    db.refresh(record)

    return record

@router.patch("/{record_id}/complete", response_model=MaintenanceResponse)
def complete_maintenance(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    record = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.id == record_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found"
        )

    if record.status != "in_progress":
        raise HTTPException(
            status_code=400,
            detail="Only maintenance in progress can be completed"
        )

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == record.vehicle_id)
        .first()
    )

    record.status = "completed"
    record.completed_date = datetime.utcnow()

    if vehicle:
        vehicle.current_status = "available"

    db.commit()
    db.refresh(record)

    return record