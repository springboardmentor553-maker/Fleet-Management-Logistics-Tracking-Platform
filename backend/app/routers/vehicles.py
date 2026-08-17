from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import UserRole, User
from app.models.vehicle import Vehicle, VehicleStatus
from app.schemas.fleet import VehicleCreate, VehicleUpdate, VehicleResponse, AvailableVehicleResponse, MaintenanceResponse
from app.utils.dependencies import require_admin, require_manager, require_dispatcher, require_driver_or_higher, require_driver_only, get_current_active_user

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)

@router.get("", response_model=list[VehicleResponse], dependencies=[Depends(require_dispatcher)])
def get_vehicles(db: Session = Depends(get_db)):
    """
    Get all vehicles.
    """
    return db.query(Vehicle).order_by(Vehicle.created_at.desc()).all()

@router.get("/my", response_model=list[VehicleResponse], dependencies=[Depends(require_driver_only)])
def get_my_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Get the vehicle assigned to the current driver (based on their active trips).
    """
    from app.models.driver import Driver
    from app.models.trip import Trip, TripStatus

    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        return []

    # Find active trips for this driver
    active_trips = db.query(Trip).filter(
        Trip.driver_id == driver.id,
        Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])
    ).all()
    
    vehicle_ids = [trip.vehicle_id for trip in active_trips if trip.vehicle_id]
    if not vehicle_ids:
        return []
        
    return db.query(Vehicle).filter(Vehicle.id.in_(vehicle_ids)).all()

@router.get("/available", response_model=list[AvailableVehicleResponse], dependencies=[Depends(require_dispatcher)])
def get_available_vehicles(db: Session = Depends(get_db)):
    """
    Get vehicles that are currently available for assignment.
    """
    vehicles = db.query(Vehicle).filter(
        Vehicle.status == VehicleStatus.ACTIVE
    ).order_by(Vehicle.created_at.desc()).all()
    
    results = []
    for v in vehicles:
        results.append({
            "vehicle_id": v.id,
            "make": v.make,
            "model": v.model,
            "license_plate": v.license_plate,
            "vin": v.vin,
            "status": v.status.value if v.status else "active",
            "capacity_weight": v.capacity_weight,
            "capacity_volume": v.capacity_volume
        })
    return results

@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_vehicle(vehicle_data: VehicleCreate, db: Session = Depends(get_db)):
    """
    Create a new vehicle.
    """
    # Check if license plate is already taken
    existing = db.query(Vehicle).filter(Vehicle.license_plate == vehicle_data.license_plate).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle with this license plate already exists."
        )

    new_vehicle = Vehicle(**vehicle_data.model_dump())
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@router.get("/{vehicle_id}", response_model=VehicleResponse, dependencies=[Depends(require_driver_or_higher)])
def get_vehicle(
    vehicle_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get details of a specific vehicle. Drivers can only access their assigned vehicles.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    if current_user.role == UserRole.DRIVER:
        from app.models.driver import Driver
        from app.models.trip import Trip, TripStatus
        
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this vehicle.")
            
        # Check if driver is assigned to a trip using this vehicle
        active_trip = db.query(Trip).filter(
            Trip.driver_id == driver.id,
            Trip.vehicle_id == vehicle_id,
            Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])
        ).first()
        
        if not active_trip:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this vehicle.")

    return vehicle

@router.get("/{vehicle_id}/maintenance-history", response_model=list[MaintenanceResponse], dependencies=[Depends(require_dispatcher)])
def get_vehicle_maintenance_history(vehicle_id: int, db: Session = Depends(get_db)):
    """
    Get maintenance records for a specific vehicle.
    """
    from app.models.maintenance import Maintenance

    records = db.query(Maintenance).filter(
        Maintenance.vehicle_id == vehicle_id
    ).order_by(Maintenance.service_date.desc()).all()
    return records

@router.put("/{vehicle_id}", response_model=VehicleResponse, dependencies=[Depends(require_manager)])
def update_vehicle(vehicle_id: int, vehicle_data: VehicleUpdate, db: Session = Depends(get_db)):
    """
    Update a vehicle's details.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    update_dict = vehicle_data.model_dump(exclude_unset=True)
    
    if "registration_number" in update_dict and update_dict["registration_number"] != vehicle.registration_number:
        existing = db.query(Vehicle).filter(Vehicle.registration_number == update_dict["registration_number"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle with this registration number already exists."
            )

    for key, value in update_dict.items():
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    """
    Delete a vehicle.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    
    db.delete(vehicle)
    db.commit()
    return None
