from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.fuel_record import FuelRecordModel as FuelLog
from app.schemas.fuel_log import (
    FuelLogCreate, FuelLogUpdate, FuelLogResponse, 
    FuelAnalyticsResponse, MonthlyFuelChart, VehicleFuelChart, DriverFuelChart
)
from app.utils.dependencies import require_admin, require_manager, require_dispatcher, get_current_active_user
from app.services.fuel_service import FuelService

router = APIRouter(
    prefix="/fuel",
    tags=["Fuel"]
)

@router.get("/analytics", response_model=FuelAnalyticsResponse, dependencies=[Depends(require_manager)])
def get_fuel_analytics(db: Session = Depends(get_db)):
    service = FuelService(db)
    return service.get_analytics()

@router.get("/charts/monthly", response_model=List[MonthlyFuelChart], dependencies=[Depends(require_manager)])
def get_monthly_charts(db: Session = Depends(get_db)):
    service = FuelService(db)
    return service.get_monthly_charts()

@router.get("/charts/vehicles", response_model=List[VehicleFuelChart], dependencies=[Depends(require_manager)])
def get_vehicle_charts(db: Session = Depends(get_db)):
    service = FuelService(db)
    return service.get_vehicle_charts()

@router.get("/charts/drivers", response_model=List[DriverFuelChart], dependencies=[Depends(require_manager)])
def get_driver_charts(db: Session = Depends(get_db)):
    service = FuelService(db)
    return service.get_driver_charts()

@router.post("", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_fuel_log(log_in: FuelLogCreate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == log_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if log_in.trip_id:
        trip = db.query(Trip).filter(Trip.id == log_in.trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
            
    if log_in.driver_id:
        driver = db.query(Driver).filter(Driver.id == log_in.driver_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")

    new_log = FuelLog(**log_in.model_dump())
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return _format_log_response(new_log)

@router.get("", response_model=List[FuelLogResponse], dependencies=[Depends(require_manager)])
def get_fuel_logs(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(FuelLog).order_by(FuelLog.fuel_date.desc())
    
    if current_user.role == UserRole.DRIVER:
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver:
            return []
        query = query.filter(FuelLog.driver_id == driver.id)
    
    logs = query.all()
    return [_format_log_response(log) for log in logs]

@router.get("/{id}", response_model=FuelLogResponse, dependencies=[Depends(require_manager)])
def get_fuel_log(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    log = db.query(FuelLog).filter(FuelLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
        
    if current_user.role == UserRole.DRIVER:
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or log.driver_id != driver.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this log")
            
    return _format_log_response(log)

@router.put("/{id}", response_model=FuelLogResponse, dependencies=[Depends(require_manager)])
def update_fuel_log(id: int, log_in: FuelLogUpdate, db: Session = Depends(get_db)):
    log = db.query(FuelLog).filter(FuelLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")

    update_data = log_in.model_dump(exclude_unset=True)
    
    if "vehicle_id" in update_data and update_data["vehicle_id"] is not None:
        if not db.query(Vehicle).filter(Vehicle.id == update_data["vehicle_id"]).first():
            raise HTTPException(status_code=404, detail="Vehicle not found")
            
    if "trip_id" in update_data and update_data["trip_id"] is not None:
        if not db.query(Trip).filter(Trip.id == update_data["trip_id"]).first():
            raise HTTPException(status_code=404, detail="Trip not found")
            
    if "driver_id" in update_data and update_data["driver_id"] is not None:
        if not db.query(Driver).filter(Driver.id == update_data["driver_id"]).first():
            raise HTTPException(status_code=404, detail="Driver not found")

    for key, value in update_data.items():
        setattr(log, key, value)

    db.commit()
    db.refresh(log)
    
    return _format_log_response(log)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_fuel_log(id: int, db: Session = Depends(get_db)):
    log = db.query(FuelLog).filter(FuelLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
        
    db.delete(log)
    db.commit()

def _format_log_response(log: FuelLog) -> Dict[str, Any]:
    data = log.__dict__.copy()
    data["vehicle_license_plate"] = log.vehicle.license_plate if log.vehicle else None
    
    driver_name = None
    if log.driver and log.driver.user:
        driver_name = log.driver.user.full_name
    data["driver_name"] = driver_name
    
    return data

