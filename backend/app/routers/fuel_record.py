from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.fuel_record import FuelRecordModel
from app.schemas.fuel_record import FuelRecordCreate, FuelRecordUpdate, FuelRecordResponse
from app.utils.dependencies import require_admin, require_manager, require_dispatcher, get_current_active_user

router = APIRouter(
    prefix="/fuel-records",
    tags=["Fuel Records"]
)

@router.post("", response_model=FuelRecordResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_fuel_record(record_in: FuelRecordCreate, db: Session = Depends(get_db)):
    if record_in.fuel_quantity <= 0:
        raise HTTPException(status_code=422, detail="Fuel quantity must be > 0")
    if record_in.fuel_cost <= 0:
        raise HTTPException(status_code=422, detail="Fuel cost must be > 0")

    vehicle = db.query(Vehicle).filter(Vehicle.id == record_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    driver = db.query(Driver).filter(Driver.id == record_in.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    new_record = FuelRecordModel(**record_in.model_dump())
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return _format_record_response(new_record)

@router.get("", response_model=List[FuelRecordResponse], dependencies=[Depends(require_manager)])
def get_fuel_records(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(FuelRecordModel).order_by(FuelRecordModel.fuel_date.desc())
    
    if current_user.role == UserRole.DRIVER:
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver:
            return []
        query = query.filter(FuelRecordModel.driver_id == driver.id)
    
    records = query.all()
    return [_format_record_response(rec) for rec in records]

@router.get("/{id}", response_model=FuelRecordResponse, dependencies=[Depends(require_manager)])
def get_fuel_record(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    record = db.query(FuelRecordModel).filter(FuelRecordModel.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Fuel record not found")
        
    if current_user.role == UserRole.DRIVER:
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or record.driver_id != driver.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this record")
            
    return _format_record_response(record)

@router.put("/{id}", response_model=FuelRecordResponse, dependencies=[Depends(require_manager)])
def update_fuel_record(id: int, record_in: FuelRecordUpdate, db: Session = Depends(get_db)):
    record = db.query(FuelRecordModel).filter(FuelRecordModel.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Fuel record not found")

    update_data = record_in.model_dump(exclude_unset=True)
    
    if "fuel_quantity" in update_data and update_data["fuel_quantity"] <= 0:
        raise HTTPException(status_code=422, detail="Fuel quantity must be > 0")
    if "fuel_cost" in update_data and update_data["fuel_cost"] <= 0:
        raise HTTPException(status_code=422, detail="Fuel cost must be > 0")
        
    if "vehicle_id" in update_data and update_data["vehicle_id"] is not None:
        if not db.query(Vehicle).filter(Vehicle.id == update_data["vehicle_id"]).first():
            raise HTTPException(status_code=404, detail="Vehicle not found")
            
    if "driver_id" in update_data and update_data["driver_id"] is not None:
        if not db.query(Driver).filter(Driver.id == update_data["driver_id"]).first():
            raise HTTPException(status_code=404, detail="Driver not found")

    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    
    return _format_record_response(record)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_fuel_record(id: int, db: Session = Depends(get_db)):
    record = db.query(FuelRecordModel).filter(FuelRecordModel.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Fuel record not found")
        
    db.delete(record)
    db.commit()

def _format_record_response(record: FuelRecordModel) -> Dict[str, Any]:
    data = record.__dict__.copy()
    data["vehicle_license_plate"] = record.vehicle.license_plate if record.vehicle else None
    
    driver_name = None
    if record.driver and record.driver.user:
        driver_name = record.driver.user.full_name
    data["driver_name"] = driver_name
    
    return data
