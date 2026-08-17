from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import UserRole
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.maintenance import Maintenance, MaintenanceStatus
from app.schemas.fleet import (
    MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse,
    MaintenanceAlertResponse, MaintenanceSummaryResponse, MaintenanceReportResponse
)
from app.utils.dependencies import require_admin, require_manager, require_dispatcher
from app.services.maintenance_alert_service import MaintenanceAlertService

router = APIRouter(
    prefix="/maintenance", 
    tags=["Maintenance"]
)

@router.get("", response_model=list[MaintenanceResponse], dependencies=[Depends(require_dispatcher)])
def get_maintenances(db: Session = Depends(get_db)):
    """
    Get all maintenance records.
    """
    return db.query(Maintenance).order_by(Maintenance.created_at.desc()).all()

@router.get("/alerts", response_model=list[MaintenanceAlertResponse], dependencies=[Depends(require_dispatcher)])
def get_maintenance_alerts(db: Session = Depends(get_db)):
    """
    Get maintenance alerts for all active and maintenance vehicles using MaintenanceAlertService.
    """
    return MaintenanceAlertService.get_alerts(db)

@router.get("/summary", response_model=MaintenanceSummaryResponse, dependencies=[Depends(require_dispatcher)])
def get_maintenance_summary(db: Session = Depends(get_db)):
    """
    Get summary statistics for maintenance records.
    """
    total_records = db.query(Maintenance).count()
    completed = db.query(Maintenance).filter(Maintenance.maintenance_status == MaintenanceStatus.COMPLETED).count()
    in_progress = db.query(Maintenance).filter(Maintenance.maintenance_status == MaintenanceStatus.IN_PROGRESS).count()
    
    total_cost = db.query(func.sum(Maintenance.service_cost)).scalar() or 0.0
    average_cost = db.query(func.avg(Maintenance.service_cost)).scalar() or 0.0
    highest_cost = db.query(func.max(Maintenance.service_cost)).scalar() or 0.0

    # Overdue and due soon calculation
    now = datetime.now(timezone.utc)
    
    # We define overdue as any record (or next_service_date on latest record) that is past
    # To keep it simple and accurate, we count the number of vehicles that have overdue/due soon alerts
    vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).all()
    overdue_count = 0
    due_soon_count = 0
    
    for v in vehicles:
        # Only SCHEDULED or IN_PROGRESS records can be overdue/due-soon.
        # COMPLETED and CANCELLED records must never increment these counters.
        latest = db.query(Maintenance).filter(
            Maintenance.vehicle_id == v.id,
            Maintenance.maintenance_status.in_([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS])
        ).order_by(Maintenance.service_date.desc()).first()
        
        if latest and latest.next_service_date:
            if latest.next_service_date < now:
                overdue_count += 1
            elif latest.next_service_date < now + timedelta(days=7):
                due_soon_count += 1

    return {
        "total_records": total_records,
        "completed": completed,
        "in_progress": in_progress,
        "overdue": overdue_count,
        "due_soon": due_soon_count,
        "total_cost": float(total_cost),
        "average_cost": float(average_cost),
        "highest_cost": float(highest_cost)
    }

@router.get("/report", response_model=MaintenanceReportResponse, dependencies=[Depends(require_dispatcher)])
def get_maintenance_report(db: Session = Depends(get_db)):
    """
    Get comprehensive report of maintenance costs grouped by category and vehicle, along with summary stats.
    """
    total_records = db.query(Maintenance).count()
    completed = db.query(Maintenance).filter(Maintenance.maintenance_status == MaintenanceStatus.COMPLETED).count()
    in_progress = db.query(Maintenance).filter(Maintenance.maintenance_status == MaintenanceStatus.IN_PROGRESS).count()
    scheduled = db.query(Maintenance).filter(Maintenance.maintenance_status == MaintenanceStatus.SCHEDULED).count()
    cancelled = db.query(Maintenance).filter(Maintenance.maintenance_status == MaintenanceStatus.CANCELLED).count()
    
    total_cost = db.query(func.sum(Maintenance.service_cost)).scalar() or 0.0

    now = datetime.now(timezone.utc)
    vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).all()
    overdue_count = 0
    
    for v in vehicles:
        # Only SCHEDULED or IN_PROGRESS records can be overdue.
        # COMPLETED and CANCELLED records must never increment this counter.
        latest = db.query(Maintenance).filter(
            Maintenance.vehicle_id == v.id,
            Maintenance.maintenance_status.in_([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS])
        ).order_by(Maintenance.service_date.desc()).first()
        
        if latest and latest.next_service_date and latest.next_service_date < now:
            overdue_count += 1

    # Group by category
    category_stats = db.query(
        Maintenance.maintenance_category,
        func.count(Maintenance.id).label('count'),
        func.sum(Maintenance.service_cost).label('total_cost')
    ).group_by(Maintenance.maintenance_category).all()

    category_summary = []
    for cat, count, cost in category_stats:
        category_summary.append({
            "category": cat.value if hasattr(cat, 'value') else cat,
            "count": count,
            "total_cost": float(cost or 0)
        })

    # Group by vehicle
    vehicle_stats = db.query(
        Vehicle.id,
        Vehicle.make,
        Vehicle.model,
        func.count(Maintenance.id).label('count'),
        func.sum(Maintenance.service_cost).label('total_cost')
    ).join(Maintenance, Vehicle.id == Maintenance.vehicle_id).group_by(Vehicle.id).all()

    vehicle_summary = []
    for vid, make, model, count, cost in vehicle_stats:
        vehicle_summary.append({
            "vehicle_id": vid,
            "vehicle": f"{make} {model}",
            "maintenance_count": count,
            "total_cost": float(cost or 0)
        })

    # Group by status
    status_stats = db.query(
        Maintenance.maintenance_status,
        func.count(Maintenance.id).label('count')
    ).group_by(Maintenance.maintenance_status).all()

    status_summary = []
    for stat, count in status_stats:
        status_summary.append({
            "status": stat.value if hasattr(stat, 'value') else stat,
            "count": count
        })

    return {
        "total_records": total_records,
        "completed": completed,
        "in_progress": in_progress,
        "scheduled": scheduled,
        "cancelled": cancelled,
        "overdue": overdue_count,
        "total_cost": float(total_cost),
        "category_summary": category_summary,
        "vehicle_summary": vehicle_summary,
        "status_summary": status_summary
    }

@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_maintenance(maintenance_data: MaintenanceCreate, db: Session = Depends(get_db)):
    """
    Create a new maintenance record for a vehicle.
    """
    # Verify vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == maintenance_data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Create maintenance record
    new_maintenance = Maintenance(**maintenance_data.model_dump())
    db.add(new_maintenance)
    
    # Update vehicle status if maintenance is in progress
    if new_maintenance.maintenance_status == MaintenanceStatus.IN_PROGRESS:
        vehicle.status = VehicleStatus.MAINTENANCE
        
    db.commit()
    db.refresh(new_maintenance)
    return new_maintenance

@router.get("/{maintenance_id}", response_model=MaintenanceResponse, dependencies=[Depends(require_dispatcher)])
def get_maintenance(maintenance_id: int, db: Session = Depends(get_db)):
    """
    Get details of a specific maintenance record.
    """
    maintenance = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")
    return maintenance

@router.put("/{maintenance_id}", response_model=MaintenanceResponse, dependencies=[Depends(require_manager)])
def update_maintenance(maintenance_id: int, maintenance_data: MaintenanceUpdate, db: Session = Depends(get_db)):
    """
    Update a maintenance record's details.
    """
    maintenance = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")

    old_status = maintenance.maintenance_status

    update_dict = maintenance_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(maintenance, key, value)
        
    new_status = maintenance.maintenance_status

    # Status update logic for vehicle
    if old_status != new_status:
        vehicle = maintenance.vehicle
        if new_status == MaintenanceStatus.IN_PROGRESS:
            vehicle.status = VehicleStatus.MAINTENANCE
        elif new_status in [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED]:
            # Only revert to ACTIVE if it's currently in MAINTENANCE to prevent breaking other workflows
            if vehicle.status == VehicleStatus.MAINTENANCE:
                vehicle.status = VehicleStatus.ACTIVE

    db.commit()
    db.refresh(maintenance)
    return maintenance

@router.delete("/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_maintenance(maintenance_id: int, db: Session = Depends(get_db)):
    """
    Delete a maintenance record.
    """
    maintenance = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")
        
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Deletion of maintenance history is strictly prohibited.")
    
    db.delete(maintenance)
    db.commit()
    return None
