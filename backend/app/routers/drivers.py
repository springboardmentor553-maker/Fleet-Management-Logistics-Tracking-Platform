from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.driver import Driver, DriverStatus
from app.models.trip import Trip, TripStatus
from app.schemas.fleet import (
    DriverUpdate, DriverProfileResponse, DriverMonitoringResponse, 
    AvailableDriverResponse, TripResponse, DriverLocationUpdate
)
from app.utils.dependencies import RoleChecker, get_current_active_user, require_admin, require_manager, require_dispatcher, require_driver_or_higher, require_driver_only

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)

@router.get("", response_model=list[DriverProfileResponse], dependencies=[Depends(require_driver_or_higher)])
def get_drivers(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Get all drivers with their associated User information. Drivers only get their own profile.
    """
    if current_user.role == UserRole.DRIVER:
        drivers = db.query(Driver).join(User, Driver.user_id == User.id).filter(Driver.user_id == current_user.id).all()
    else:
        drivers = db.query(Driver).join(User, Driver.user_id == User.id).order_by(Driver.created_at.desc()).all()
    results = []
    for d in drivers:
        results.append({
            "id": d.id,
            "user_id": d.user_id,
            "license_number": d.license_number,
            "phone_number": d.phone_number,
            "status": d.status,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
            "user_email": d.user.email,
            "user_name": d.user.full_name
        })
    return results

@router.get("/status", response_model=list[DriverMonitoringResponse], dependencies=[Depends(require_manager)])
def get_driver_status(db: Session = Depends(get_db)):
    """
    Get driver monitoring information including active trips and assigned vehicles.
    """
    drivers = db.query(Driver).join(User, Driver.user_id == User.id).order_by(Driver.created_at.desc()).all()
    results = []
    for d in drivers:
        # Find active trip for this driver
        active_trip = db.query(Trip).filter(
            Trip.driver_id == d.id,
            Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])
        ).first()
        
        results.append({
            "driver_id": d.id,
            "name": d.user.full_name if d.user else "Unknown",
            "email": d.user.email if d.user else "Unknown",
            "phone": d.phone_number,
            "license_number": d.license_number,
            "status": d.status.value,
            "active_trip_id": active_trip.id if active_trip else None,
            "assigned_vehicle_id": active_trip.vehicle_id if active_trip else None
        })
    return results

@router.get("/available", response_model=list[AvailableDriverResponse], dependencies=[Depends(require_dispatcher)])
def get_available_drivers(db: Session = Depends(get_db)):
    """
    Get drivers who are currently available for assignment.
    """
    drivers = db.query(Driver).join(User, Driver.user_id == User.id).filter(
        Driver.status == DriverStatus.AVAILABLE
    ).order_by(Driver.created_at.desc()).all()
    
    results = []
    for d in drivers:
        results.append({
            "driver_id": d.id,
            "name": d.user.full_name if d.user else "Unknown",
            "status": d.status.value
        })
    return results

@router.get("/me/trips", response_model=list[TripResponse])
def get_my_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all trips assigned to the logged-in driver's profile.
    """
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can access their own trips."
        )
        
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Driver profile not found."
        )
        
    trips = db.query(Trip).filter(Trip.driver_id == driver.id).order_by(Trip.created_at.desc()).all()
    return trips

@router.post("/location", dependencies=[Depends(require_driver_only)])
async def update_driver_location(
    location_data: DriverLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update the authenticated driver's current live location.
    """
    from datetime import datetime, timezone
    from app.websocket.connection_manager import manager
    
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Driver profile not found."
        )

    # Update Driver location
    driver.current_latitude = location_data.latitude
    driver.current_longitude = location_data.longitude
    driver.location_updated_at = datetime.now(timezone.utc)
    db.commit()

    # Find active trip
    active_trip = db.query(Trip).filter(
        Trip.driver_id == driver.id,
        Trip.trip_status == TripStatus.IN_TRANSIT
    ).first()

    if active_trip:
        # Update trip location as well
        active_trip.current_latitude = location_data.latitude
        active_trip.current_longitude = location_data.longitude
        db.commit()

        # Broadcast update to websocket
        if active_trip.shipment:
            tracking_number = active_trip.shipment.tracking_number
            await manager.broadcast_to_room(tracking_number, {
                "type": "location_update",
                "data": {
                    "driver_id": driver.id,
                    "tracking_number": tracking_number,
                    "latitude": location_data.latitude,
                    "longitude": location_data.longitude,
                    "status": active_trip.shipment.current_status.value,
                    "timestamp": driver.location_updated_at.isoformat()
                }
            })

    return {"message": "Location updated successfully"}

@router.get("/{driver_id}", response_model=DriverProfileResponse, dependencies=[Depends(require_driver_or_higher)])
def get_driver(driver_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Get details of a specific driver.
    """
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        
    if current_user.role == UserRole.DRIVER and driver.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view this driver.")
    
    return {
        "id": driver.id,
        "user_id": driver.user_id,
        "license_number": driver.license_number,
        "phone_number": driver.phone_number,
        "status": driver.status,
        "created_at": driver.created_at,
        "updated_at": driver.updated_at,
        "user_email": driver.user.email if driver.user else None,
        "user_name": driver.user.full_name if driver.user else None
    }

@router.put("/{driver_id}", response_model=DriverProfileResponse, dependencies=[Depends(require_manager)])
def update_driver(driver_id: int, driver_data: DriverUpdate, db: Session = Depends(get_db)):
    """
    Update a driver's phone number, status, or license number.
    """
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    update_dict = driver_data.model_dump(exclude_unset=True)
    
    if "license_number" in update_dict and update_dict["license_number"] != driver.license_number:
        existing = db.query(Driver).filter(Driver.license_number == update_dict["license_number"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Driver license number already in use")

    for key, value in update_dict.items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)
    
    return {
        "id": driver.id,
        "user_id": driver.user_id,
        "license_number": driver.license_number,
        "phone_number": driver.phone_number,
        "status": driver.status,
        "created_at": driver.created_at,
        "updated_at": driver.updated_at,
        "user_email": driver.user.email if driver.user else None,
        "user_name": driver.user.full_name if driver.user else None
    }

@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    """
    Delete a driver. This cascadingly updates/deletes their associated User.
    """
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    
    # Optional: also delete the associated user
    user = db.query(User).filter(User.id == driver.user_id).first()
    db.delete(driver)
    if user:
        db.delete(user)
        
    db.commit()
    return None

@router.get("/{driver_id}/performance", dependencies=[Depends(require_driver_or_higher)])
def get_driver_performance(
    driver_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """
    Get driver performance metrics based on trips.
    """
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    if current_user.role == UserRole.DRIVER and driver.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view performance")

    total_trips = db.query(Trip).filter(Trip.driver_id == driver_id).count()
    completed_trips = db.query(Trip).filter(Trip.driver_id == driver_id, Trip.trip_status == TripStatus.COMPLETED).count()
    active_trips = db.query(Trip).filter(Trip.driver_id == driver_id, Trip.trip_status.in_([TripStatus.IN_TRANSIT, TripStatus.CREATED])).count()
    cancelled_trips = db.query(Trip).filter(Trip.driver_id == driver_id, Trip.trip_status == TripStatus.CANCELLED).count()
    
    completion_rate = (completed_trips / total_trips * 100) if total_trips > 0 else 0

    return {
        "driver_id": driver.id,
        "driver_name": f"{driver.user.full_name}" if driver.user else "Unknown",
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_trips": active_trips,
        "cancelled_trips": cancelled_trips,
        "completion_rate": round(completion_rate, 2)
    }
