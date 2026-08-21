from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.database import get_db
from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceStatusUpdate
)

from app.utils.audit import create_audit_log
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)


# ----------------------------------------------------
# Create Maintenance
# ----------------------------------------------------
@router.post("/")
def create_maintenance(
    maintenance: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == maintenance.vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    record = Maintenance(
        vehicle_id=maintenance.vehicle_id,
        maintenance_category=maintenance.maintenance_category,
        service_date=maintenance.service_date,
        next_service_date=maintenance.next_service_date,
        service_cost=maintenance.service_cost,
        service_provider=maintenance.service_provider,
        notes=maintenance.notes
    )

    vehicle.status = "Maintenance"

    db.add(record)

    # Generate maintenance ID before audit
    db.flush()

    create_audit_log(
        db=db,
        user=current_user,
        module="Maintenance",
        action="CREATE",
        details=(
            f"Maintenance record ID {record.id} was created "
            f"for Vehicle ID {record.vehicle_id}. "
            f"Category: {record.maintenance_category}."
        )
    )

    db.commit()
    db.refresh(record)

    return {
        "message": "Maintenance created successfully",
        "maintenance": record
    }


# ----------------------------------------------------
# Alerts
# ----------------------------------------------------
@router.get("/alerts")
def maintenance_alerts(db: Session = Depends(get_db)):

    today = date.today()

    records = (
        db.query(Maintenance)
        .filter(
            Maintenance.is_active == 1,
            Maintenance.status == "Scheduled",
            Maintenance.service_date <= today
        )
        .all()
    )

    alerts = []

    for item in records:
        alerts.append({
            "maintenance_id": item.id,
            "vehicle_id": item.vehicle_id,
            "category": item.maintenance_category,
            "service_date": item.service_date,
            "message": "Maintenance Due"
        })

    return {
        "total_alerts": len(alerts),
        "alerts": alerts
    }


# ----------------------------------------------------
# Reports
# ----------------------------------------------------
@router.get("/reports")
def maintenance_report(db: Session = Depends(get_db)):

    records = (
        db.query(Maintenance)
        .filter(Maintenance.is_active == 1)
        .all()
    )

    total = len(records)

    scheduled = len([
        r for r in records
        if r.status == "Scheduled"
    ])

    completed = len([
        r for r in records
        if r.status == "Completed"
    ])

    cancelled = len([
        r for r in records
        if r.status == "Cancelled"
    ])

    total_cost = sum([
        r.service_cost or 0
        for r in records
    ])

    return {
        "total_records": total,
        "scheduled": scheduled,
        "completed": completed,
        "cancelled": cancelled,
        "total_service_cost": total_cost
    }


# ----------------------------------------------------
# Upcoming Maintenance
# ----------------------------------------------------
@router.get("/upcoming")
def upcoming_maintenance(
    db: Session = Depends(get_db)
):

    today = date.today()
    next_week = today + timedelta(days=7)

    records = (
        db.query(Maintenance)
        .filter(
            Maintenance.is_active == 1,
            Maintenance.status != "Completed",
            Maintenance.next_service_date >= today,
            Maintenance.next_service_date <= next_week
        )
        .all()
    )

    result = []

    for item in records:

        vehicle = (
            db.query(Vehicle)
            .filter(Vehicle.id == item.vehicle_id)
            .first()
        )

        result.append({
            "maintenance_id": item.id,
            "vehicle_id": item.vehicle_id,
            "vehicle_number": vehicle.vehicle_number if vehicle else None,
            "category": item.maintenance_category,
            "next_service_date": item.next_service_date,
            "status": item.status,
            "service_provider": item.service_provider
        })

    return {
        "total_upcoming": len(result),
        "maintenance": result
    }


# ----------------------------------------------------
# Overdue Maintenance
# ----------------------------------------------------
@router.get("/overdue")
def overdue_maintenance(
    db: Session = Depends(get_db)
):

    today = date.today()

    records = (
        db.query(Maintenance)
        .filter(
            Maintenance.is_active == 1,
            Maintenance.next_service_date < today,
            Maintenance.status != "Completed"
        )
        .all()
    )

    result = []

    for item in records:

        vehicle = (
            db.query(Vehicle)
            .filter(Vehicle.id == item.vehicle_id)
            .first()
        )

        result.append({
            "maintenance_id": item.id,
            "vehicle_id": item.vehicle_id,
            "vehicle_number": vehicle.vehicle_number if vehicle else None,
            "category": item.maintenance_category,
            "next_service_date": item.next_service_date,
            "status": item.status,
            "service_provider": item.service_provider
        })

    return {
        "total_overdue": len(result),
        "maintenance": result
    }


# ----------------------------------------------------
# Vehicle Maintenance History
# ----------------------------------------------------
@router.get("/history/{vehicle_id}")
def vehicle_history(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    history = (
        db.query(Maintenance)
        .filter(
            Maintenance.vehicle_id == vehicle_id,
            Maintenance.is_active == 1
        )
        .order_by(Maintenance.service_date.desc())
        .all()
    )

    return history


# ----------------------------------------------------
# Maintenance Cost Summary
# ----------------------------------------------------
@router.get("/cost-summary")
def maintenance_cost_summary(
    db: Session = Depends(get_db)
):

    records = (
        db.query(Maintenance)
        .filter(Maintenance.is_active == 1)
        .all()
    )

    costs = [
        r.service_cost or 0
        for r in records
    ]

    if len(costs) == 0:

        return {
            "total_cost": 0,
            "average_cost": 0,
            "highest_cost": 0,
            "lowest_cost": 0
        }

    return {
        "total_cost": sum(costs),
        "average_cost": round(sum(costs) / len(costs), 2),
        "highest_cost": max(costs),
        "lowest_cost": min(costs)
    }


# ----------------------------------------------------
# Complete Maintenance
# ----------------------------------------------------
@router.patch("/{maintenance_id}/complete")
def complete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    record = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance not found"
        )

    record.status = "Completed"

    record.next_service_date = (
        record.service_date + timedelta(days=180)
    )

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == record.vehicle_id)
        .first()
    )

    if vehicle:
        vehicle.status = "Available"

    create_audit_log(
        db=db,
        user=current_user,
        module="Maintenance",
        action="COMPLETE",
        details=(
            f"Maintenance record ID {record.id} "
            f"for Vehicle ID {record.vehicle_id} "
            f"was completed."
        )
    )

    db.commit()
    db.refresh(record)

    return {
        "message": "Maintenance completed successfully",
        "maintenance": record
    }


# ----------------------------------------------------
# Update Status
# ----------------------------------------------------
@router.patch("/{maintenance_id}/status")
def update_status(
    maintenance_id: int,
    data: MaintenanceStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    record = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance not found"
        )

    old_status = record.status

    record.status = data.status

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == record.vehicle_id)
        .first()
    )

    if vehicle:

        if data.status == "Completed":
            vehicle.status = "Available"

        elif data.status == "Scheduled":
            vehicle.status = "Maintenance"

    create_audit_log(
        db=db,
        user=current_user,
        module="Maintenance",
        action="STATUS_UPDATE",
        details=(
            f"Maintenance ID {record.id} status changed "
            f"from {old_status} to {record.status}."
        )
    )

    db.commit()

    return {
        "message": "Status updated successfully"
    }


# ----------------------------------------------------
# Get All
# ----------------------------------------------------
@router.get("/")
def get_all(db: Session = Depends(get_db)):

    return (
        db.query(Maintenance)
        .filter(Maintenance.is_active == 1)
        .all()
    )


# ----------------------------------------------------
# Get By ID
# ----------------------------------------------------
@router.get("/{maintenance_id}")
def get_by_id(
    maintenance_id: int,
    db: Session = Depends(get_db)
):

    record = (
        db.query(Maintenance)
        .filter(
            Maintenance.id == maintenance_id,
            Maintenance.is_active == 1
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance not found"
        )

    return record


# ----------------------------------------------------
# Update
# ----------------------------------------------------
@router.put("/{maintenance_id}")
def update(
    maintenance_id: int,
    updated: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    record = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance not found"
        )

    values = updated.model_dump(exclude_unset=True)

    for key, value in values.items():
        setattr(record, key, value)

    create_audit_log(
        db=db,
        user=current_user,
        module="Maintenance",
        action="UPDATE",
        details=(
            f"Maintenance record ID {record.id} "
            f"was updated."
        )
    )

    db.commit()
    db.refresh(record)

    return {
        "message": "Updated successfully",
        "maintenance": record
    }


# ----------------------------------------------------
# Soft Delete
# ----------------------------------------------------
@router.delete("/{maintenance_id}")
def delete(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    record = (
        db.query(Maintenance)
        .filter(Maintenance.id == maintenance_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Maintenance not found"
        )

    record.is_active = 0

    create_audit_log(
        db=db,
        user=current_user,
        module="Maintenance",
        action="DELETE",
        details=(
            f"Maintenance record ID {record.id} "
            f"for Vehicle ID {record.vehicle_id} "
            f"was archived."
        )
    )

    db.commit()

    return {
        "message": "Maintenance archived successfully"
    }