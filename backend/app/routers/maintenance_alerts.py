from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.maintenance_alert import MaintenanceAlert, AlertStatus
from app.models.vehicle import Vehicle
from app.models.maintenance import Maintenance
from app.schemas.maintenance_alert import MaintenanceAlertCreate, MaintenanceAlertUpdate, MaintenanceAlertResponse
from app.utils.dependencies import require_admin, require_manager, require_dispatcher
from app.models.user import UserRole

router = APIRouter(prefix="/maintenance-alerts", tags=["Maintenance Alerts"])

@router.post("/", response_model=MaintenanceAlertResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_maintenance_alert(
    alert_in: MaintenanceAlertCreate, 
    db: Session = Depends(get_db)
):
    # Check if vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == alert_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Check if maintenance exists
    maintenance = db.query(Maintenance).filter(Maintenance.id == alert_in.maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    # Prevent duplicate pending alerts for the same maintenance schedule
    existing_alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.vehicle_id == alert_in.vehicle_id,
        MaintenanceAlert.maintenance_id == alert_in.maintenance_id,
        MaintenanceAlert.alert_status == AlertStatus.PENDING
    ).first()

    if existing_alert:
        raise HTTPException(status_code=400, detail="A pending alert already exists for this maintenance record")

    new_alert = MaintenanceAlert(**alert_in.model_dump())
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    # Format the response object to match the schema
    alert_dict = {
        "id": new_alert.id,
        "vehicle_id": new_alert.vehicle_id,
        "maintenance_id": new_alert.maintenance_id,
        "alert_message": new_alert.alert_message,
        "alert": new_alert.alert_message,
        "alert_type": new_alert.alert_type,
        "alert_status": new_alert.alert_status,
        "next_service_date": new_alert.next_service_date,
        "generated_date": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "vehicle": vehicle.license_plate if vehicle else "",
        "license_plate": vehicle.license_plate if vehicle else "",
        "category": maintenance.maintenance_category.value if hasattr(maintenance.maintenance_category, 'value') else maintenance.maintenance_category
    }
    
    return alert_dict

@router.get("/", response_model=List[MaintenanceAlertResponse], dependencies=[Depends(require_dispatcher)])
def get_maintenance_alerts(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    alerts = db.query(MaintenanceAlert).options(joinedload(MaintenanceAlert.vehicle), joinedload(MaintenanceAlert.maintenance)).offset(skip).limit(limit).all()
    results = []
    for alert in alerts:
        # Populate UI fields dynamically if the relationships are loaded
        # Since we have relationship("Vehicle") and relationship("Maintenance")
        vehicle = alert.vehicle
        maintenance = alert.maintenance
        
        alert_dict = alert.__dict__.copy()
        if vehicle:
            alert_dict["vehicle"] = f"{vehicle.make} {vehicle.model}"
            alert_dict["license_plate"] = vehicle.license_plate
        if maintenance:
            if hasattr(maintenance.maintenance_category, 'value'):
                alert_dict["category"] = maintenance.maintenance_category.value.replace('_', ' ').title()
            else:
                alert_dict["category"] = str(maintenance.maintenance_category).replace('_', ' ').title()
            
        alert_dict["alert"] = alert.alert_message
        results.append(alert_dict)
        
    return results

@router.get("/{alert_id}", response_model=MaintenanceAlertResponse, dependencies=[Depends(require_manager)])
def get_maintenance_alert(
    alert_id: int, 
    db: Session = Depends(get_db)
):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Maintenance alert not found")
    return alert

@router.put("/{alert_id}", response_model=MaintenanceAlertResponse, dependencies=[Depends(require_manager)])
def update_maintenance_alert(
    alert_id: int, 
    alert_in: MaintenanceAlertUpdate, 
    db: Session = Depends(get_db)
):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Maintenance alert not found")
    
    update_data = alert_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(alert, key, value)
        
    db.commit()
    db.refresh(alert)
    return alert

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_maintenance_alert(
    alert_id: int, 
    db: Session = Depends(get_db)
):
    alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Maintenance alert not found")
    
    db.delete(alert)
    db.commit()
    return None
