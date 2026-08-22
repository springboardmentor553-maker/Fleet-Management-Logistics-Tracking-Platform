from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.maintenance import MaintenanceRecord
from app.tasks.maintenance_tasks import run_maintenance_alerts_check

from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
    VehicleHealthReport,
)


router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)

_manager_or_admin = require_roles(
    Role.ADMIN,
    Role.FLEET_MANAGER
)


# ============================================================
# 1. SCHEDULE MAINTENANCE
# ============================================================

@router.post(
    "/",
    response_model=MaintenanceResponse,
    status_code=status.HTTP_201_CREATED
)
def schedule_maintenance(
    data: MaintenanceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    # --------------------------------------------------------
    # 1. Check vehicle exists
    # --------------------------------------------------------

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == data.vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # --------------------------------------------------------
    # 2. Vehicle cannot be maintained while in transit
    # --------------------------------------------------------

    if vehicle.current_status == "in_transit":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Vehicle is currently in transit. "
                "Maintenance cannot be scheduled."
            )
        )

    # --------------------------------------------------------
    # 3. Vehicle must be available
    # --------------------------------------------------------

    if vehicle.current_status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Vehicle is currently "
                f"'{vehicle.current_status}'. "
                "Maintenance can only be scheduled "
                "when the vehicle is available."
            )
        )

    # --------------------------------------------------------
    # 4. Check for existing active maintenance
    # --------------------------------------------------------

    existing = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.vehicle_id == data.vehicle_id,
            MaintenanceRecord.status.in_(
                [
                    "scheduled",
                    "in_progress"
                ]
            )
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This vehicle already has a scheduled "
                "or in-progress maintenance."
            )
        )

    # --------------------------------------------------------
    # 5. Create maintenance record
    # --------------------------------------------------------

    record = MaintenanceRecord(
        vehicle_id=data.vehicle_id,
        category=data.category,
        description=data.description,
        cost=data.cost,
        service_provider=data.service_provider,
        status="scheduled",
        scheduled_date=(
            data.scheduled_date
            if data.scheduled_date
            else datetime.utcnow()
        ),
        next_service_date=data.next_service_date,
        odometer_km=(
            data.odometer_km
            if data.odometer_km is not None
            else 0.0
        ),
        health_score=(
            data.health_score
            if data.health_score is not None
            else 95
        ),
        notes=data.notes,
    )

    # --------------------------------------------------------
    # 6. Change vehicle status
    # --------------------------------------------------------

    vehicle.current_status = "maintenance"

    db.add(record)
    db.commit()
    db.refresh(record)

    try:
        run_maintenance_alerts_check(db)
    except Exception:
        pass

    return record


# ============================================================
# 2. GET ALL MAINTENANCE RECORDS
# ============================================================

@router.get(
    "/",
    response_model=List[MaintenanceResponse]
)
def list_maintenance_records(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        run_maintenance_alerts_check(db)
    except Exception:
        pass

    query = db.query(MaintenanceRecord)

    if category:
        query = query.filter(
            MaintenanceRecord.category == category
        )

    if status:
        query = query.filter(
            MaintenanceRecord.status == status
        )

    return (
        query
        .order_by(MaintenanceRecord.id.desc())
        .all()
    )


# ============================================================
# 3. GET VEHICLE MAINTENANCE HISTORY
# ============================================================

@router.get(
    "/vehicle/{vehicle_id}",
    response_model=List[MaintenanceResponse]
)
def get_vehicle_maintenance_history(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.vehicle_id == vehicle_id
        )
        .order_by(MaintenanceRecord.id.desc())
        .all()
    )


# ============================================================
# 4. UPDATE MAINTENANCE RECORD
# ============================================================

@router.patch(
    "/{record_id}",
    response_model=MaintenanceResponse
)
def update_maintenance_record(
    record_id: int,
    data: MaintenanceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    record = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.id == record_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found"
        )

    # --------------------------------------------------------
    # Update fields
    # --------------------------------------------------------

    if data.category is not None:
        record.category = data.category

    if data.description is not None:
        record.description = data.description

    if data.cost is not None:
        record.cost = data.cost

    if data.service_provider is not None:
        record.service_provider = data.service_provider

    if data.next_service_date is not None:
        record.next_service_date = data.next_service_date

    if data.status is not None:
        record.status = data.status

        # ----------------------------------------------------
        # Maintenance completed
        # ----------------------------------------------------

        if data.status == "completed":
            record.completed_date = datetime.utcnow()

            vehicle = (
                db.query(Vehicle)
                .filter(
                    Vehicle.id == record.vehicle_id
                )
                .first()
            )

            if (
                vehicle
                and vehicle.current_status == "maintenance"
            ):
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


# ============================================================
# 5. DELETE / CANCEL MAINTENANCE RECORD
# ============================================================

@router.delete(
    "/{record_id}",
    response_model=MaintenanceResponse
)
def delete_maintenance_record(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    record = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.id == record_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found"
        )

    # --------------------------------------------------------
    # Keep maintenance history
    # --------------------------------------------------------

    record.status = "cancelled"

    # --------------------------------------------------------
    # If vehicle was in maintenance, make it available
    # --------------------------------------------------------

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == record.vehicle_id
        )
        .first()
    )

    if (
        vehicle
        and vehicle.current_status == "maintenance"
    ):
        vehicle.current_status = "available"

    db.commit()
    db.refresh(record)

    return record


# ============================================================
# 6. VEHICLE HEALTH REPORTS
# ============================================================

@router.get(
    "/health-reports",
    response_model=List[VehicleHealthReport]
)
def get_vehicle_health_reports(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vehicles = db.query(Vehicle).all()

    reports = []

    for vehicle in vehicles:

        records = (
            db.query(MaintenanceRecord)
            .filter(
                MaintenanceRecord.vehicle_id == vehicle.id
            )
            .order_by(
                MaintenanceRecord.id.desc()
            )
            .all()
        )

        # ----------------------------------------------------
        # Completed maintenance
        # ----------------------------------------------------

        completed = [
            record
            for record in records
            if record.status == "completed"
        ]

        # ----------------------------------------------------
        # Pending maintenance
        # ----------------------------------------------------

        pending = [
            record
            for record in records
            if record.status in (
                "scheduled",
                "in_progress"
            )
        ]

        # ----------------------------------------------------
        # Last service date
        # ----------------------------------------------------

        last_date = (
            completed[0].completed_date
            if completed
            else None
        )

        # ----------------------------------------------------
        # Latest health score
        # ----------------------------------------------------

        latest_score = (
            records[0].health_score
            if records
            else 95
        )

        # ----------------------------------------------------
        # Alerts
        # ----------------------------------------------------

        alerts = []

        if latest_score < 70:
            alerts.append(
                "Low Health Score — "
                "Engine & Brake inspection required"
            )

        if vehicle.current_status == "maintenance":
            alerts.append(
                "Vehicle currently in maintenance service"
            )

        if len(pending) > 0:
            alerts.append(
                f"{len(pending)} maintenance tasks pending"
            )

        # ----------------------------------------------------
        # Health status
        # ----------------------------------------------------

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
                vehicle_id=vehicle.id,
                plate_number=vehicle.plate_number,
                vehicle_type=vehicle.vehicle_type,
                health_score=latest_score,
                health_status=health_status,
                last_serviced_date=last_date,
                pending_maintenance_count=len(pending),
                alerts=alerts,
            )
        )

    return reports


# ============================================================
# 7. UPCOMING MAINTENANCE
# ============================================================

@router.get(
    "/upcoming",
    response_model=List[MaintenanceResponse]
)
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

    upcoming_limit = today + timedelta(days=7)

    return (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.status.in_(
                [
                    "scheduled",
                    "in_progress"
                ]
            ),
            MaintenanceRecord.scheduled_date >= today,
            MaintenanceRecord.scheduled_date <= upcoming_limit,
        )
        .order_by(
            MaintenanceRecord.scheduled_date.asc()
        )
        .all()
    )


# ============================================================
# 8. OVERDUE MAINTENANCE
# ============================================================

@router.get(
    "/overdue",
    response_model=List[MaintenanceResponse]
)
def overdue_maintenance(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    today = datetime.utcnow().replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )

    return (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.status.in_(
                [
                    "scheduled",
                    "in_progress"
                ]
            ),
            MaintenanceRecord.scheduled_date < today,
        )
        .order_by(
            MaintenanceRecord.scheduled_date.asc()
        )
        .all()
    )


# ============================================================
# 9. START MAINTENANCE
# ============================================================

@router.patch(
    "/{record_id}/start",
    response_model=MaintenanceResponse
)
def start_maintenance(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    record = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.id == record_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found"
        )

    if record.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maintenance is already completed"
        )

    if record.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled maintenance cannot be started"
        )

    if record.status == "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maintenance is already in progress"
        )

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == record.vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    record.status = "in_progress"
    vehicle.current_status = "maintenance"

    db.commit()
    db.refresh(record)

    return record


# ============================================================
# 10. COMPLETE MAINTENANCE
# ============================================================

@router.patch(
    "/{record_id}/complete",
    response_model=MaintenanceResponse
)
def complete_maintenance(
    record_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_manager_or_admin),
):
    record = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.id == record_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found"
        )

    if record.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maintenance is already completed"
        )

    if record.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled maintenance cannot be completed"
        )

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == record.vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # --------------------------------------------------------
    # Complete maintenance
    # --------------------------------------------------------

    record.status = "completed"
    record.completed_date = datetime.utcnow()

    # --------------------------------------------------------
    # Vehicle becomes available
    # --------------------------------------------------------

    if vehicle.current_status == "maintenance":
        vehicle.current_status = "available"

    db.commit()
    db.refresh(record)

    return record