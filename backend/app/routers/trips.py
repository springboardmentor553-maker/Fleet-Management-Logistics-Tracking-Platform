from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.driver import Driver
from app.models.trip import Trip, TripStatus
from app.schemas.fleet import TripCreate, TripUpdate, TripResponse, TripAssignRequest, TripLocationUpdate
from app.services.trip import TripService
from datetime import datetime, timezone
from app.utils.dependencies import get_current_active_user, require_admin, require_dispatcher, require_driver_or_higher

router = APIRouter(prefix="/trips", tags=["Trips"])

def get_trip_service(db: Session = Depends(get_db)) -> TripService:
    """Dependency to retrieve TripService."""
    return TripService(db)

@router.get("", response_model=list[TripResponse], dependencies=[Depends(require_driver_or_higher)])
def get_trips(
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get trips:
    - Admin, Fleet Managers, and Dispatchers get all trips.
    - Drivers only get trips assigned to them.
    """
    if current_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER]:
        return service.get_all()
    elif current_user.role == UserRole.DRIVER:
        driver = service.db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver:
            return []
        return service.db.query(Trip).filter(Trip.driver_id == driver.id).order_by(Trip.created_at.desc()).all()
    return []

@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_dispatcher)])
def create_trip(
    trip_data: TripCreate,
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new trip (Admins, Fleet Managers, and Dispatchers only).
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create trips."
        )
    return service.create_trip(trip_data)

@router.get("/{trip_id}", response_model=TripResponse, dependencies=[Depends(require_driver_or_higher)])
def get_trip(
    trip_id: int,
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific trip.
    - Drivers can only see their own assigned trips.
    """
    trip = service.get_by_id(trip_id)

    if current_user.role == UserRole.DRIVER:
        driver = service.db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or trip.driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this trip."
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this trip."
        )

    return trip

@router.put("/{trip_id}", response_model=TripResponse, dependencies=[Depends(require_driver_or_higher)])
def update_trip(
    trip_id: int,
    trip_data: TripUpdate,
    background_tasks: BackgroundTasks,
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a trip:
    - Admins, Fleet Managers, and Dispatchers can update any trip attributes.
    - Drivers can ONLY update the status of trips assigned to them.
    """
    trip = service.get_by_id(trip_id)
    update_dict = trip_data.model_dump(exclude_unset=True)

    if current_user.role == UserRole.DRIVER:
        driver = service.db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or trip.driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this trip."
            )
        
        # Drivers can ONLY update the status field
        allowed_keys = {"trip_status"}
        if not set(update_dict.keys()).issubset(allowed_keys):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Drivers are only allowed to update the status of their assigned trip."
            )
    else:
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update trips."
            )

    return service.update_trip(trip_id, trip_data, background_tasks)

@router.post("/{trip_id}/assign", response_model=TripResponse, dependencies=[Depends(require_dispatcher)])
def assign_trip(
    trip_id: int,
    assign_data: TripAssignRequest,
    background_tasks: BackgroundTasks,
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Assign a driver and vehicle to a trip.
    Admins, Fleet Managers, and Dispatchers only.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to assign trips."
        )

    # Use the TripUpdate schema to trigger the same validation and status updates in TripService
    update_data = TripUpdate(
        driver_id=assign_data.driver_id,
        vehicle_id=assign_data.vehicle_id
    )
    return service.update_trip(trip_id, update_data, background_tasks)

@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_trip(
    trip_id: int,
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a trip (Admins and Fleet Managers only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete trips."
        )

    service.delete_trip(trip_id)
    return None

@router.get("/{trip_id}/route", dependencies=[Depends(require_driver_or_higher)])
def get_trip_route(
    trip_id: int,
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve routing details (distance, duration, summary, polyline) for a trip.
    """
    trip = service.get_by_id(trip_id)
    if current_user.role == UserRole.DRIVER:
        driver = service.db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or trip.driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this route."
            )
            
    plat = trip.pickup_latitude
    plng = trip.pickup_longitude
    dlat = trip.destination_latitude
    dlng = trip.destination_longitude
    
    # Generate coordinates and routing details dynamically if not present
    if (plat is None or plng is None or dlat is None or dlng is None or 
        trip.distance_km is None or trip.estimated_duration is None or 
        trip.route_geometry is None):
        
        from app.services.geocoding_service import GeocodingService
        from app.services.route_service import RouteService
        
        if plat is None or plng is None:
            plat, plng = GeocodingService.geocode(trip.pickup_location)
            trip.pickup_latitude = plat
            trip.pickup_longitude = plng
        if dlat is None or dlng is None:
            dlat, dlng = GeocodingService.geocode(trip.destination)
            trip.destination_latitude = dlat
            trip.destination_longitude = dlng
            
        route_info = RouteService.get_route(plat, plng, dlat, dlng)
        trip.distance_km = route_info["distance_km"]
        trip.estimated_duration = route_info["estimated_duration"]
        trip.route_summary = route_info["route_summary"]
        trip.route_geometry = route_info["route_geometry"]
        
        service.db.commit()
        service.db.refresh(trip)
        
    return {
        "trip_id": trip.id,
        "pickup_location": trip.pickup_location,
        "destination": trip.destination,
        "pickup_coordinates": {
            "latitude": trip.pickup_latitude,
            "longitude": trip.pickup_longitude
        },
        "destination_coordinates": {
            "latitude": trip.destination_latitude,
            "longitude": trip.destination_longitude
        },
        "current_location": {
            "latitude": trip.current_latitude,
            "longitude": trip.current_longitude,
            "updated_at": trip.location_updated_at.isoformat() if trip.location_updated_at else None
        } if trip.current_latitude is not None and trip.current_longitude is not None else None,
        "distance": f"{trip.distance_km} km" if trip.distance_km is not None else "0 km",
        "estimated_time": trip.estimated_duration,
        "estimated_travel_time": trip.estimated_duration,
        "route_summary": trip.route_summary or "NH44 Route",
        "route_geometry": trip.route_geometry,
        "polyline": ""
    }

@router.get("/{trip_id}/eta", dependencies=[Depends(require_driver_or_higher)])
def get_trip_eta(
    trip_id: int,
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve the estimated time of arrival for a trip.
    """
    trip = service.get_by_id(trip_id)
    if current_user.role == UserRole.DRIVER:
        driver = service.db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or trip.driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this trip's ETA."
            )
            
    from app.services.eta_service import ETAService
    from datetime import datetime, timezone
    
    start_time = trip.created_at
    if trip.trip_status == TripStatus.IN_TRANSIT:
        start_time = datetime.now(timezone.utc)
        
    eta = ETAService.calculate_eta(start_time, trip.estimated_duration)
    
    return {
        "trip_id": trip.id,
        "distance": trip.distance_km,
        "travel_duration": trip.estimated_duration,
        "eta": eta.isoformat() if eta else None
    }

@router.put("/{trip_id}/location", dependencies=[Depends(require_driver_or_higher)])
async def update_trip_location(
    trip_id: int,
    location_data: TripLocationUpdate,
    service: TripService = Depends(get_trip_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update the current location of the vehicle for this trip.
    Validates coordinates and broadcasts a WebSocket update.
    """
    trip = service.get_by_id(trip_id)
    
    # Check permissions (only admins/managers/dispatchers or the assigned driver)
    if current_user.role == UserRole.DRIVER:
        driver = service.db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or trip.driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this trip's location."
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update trips."
        )

    if trip.trip_status not in [TripStatus.IN_TRANSIT, TripStatus.CREATED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update location for a trip with status {trip.trip_status.value}"
        )
        
    trip.current_latitude = location_data.latitude
    trip.current_longitude = location_data.longitude
    trip.location_updated_at = datetime.now(timezone.utc)
    
    service.db.commit()
    service.db.refresh(trip)
    
    # Broadcast update to websocket
    if trip.shipment:
        from app.websocket.connection_manager import manager
        tracking_number = trip.shipment.tracking_number
        await manager.broadcast_to_room(tracking_number, {
            "type": "location_update",
            "data": {
                "tracking_number": tracking_number,
                "latitude": trip.current_latitude,
                "longitude": trip.current_longitude,
                "status": trip.shipment.current_status.value,
                "timestamp": trip.location_updated_at.isoformat()
            }
        })
        
    return {
        "status": "success",
        "current_location": {
            "latitude": trip.current_latitude,
            "longitude": trip.current_longitude,
            "updated_at": trip.location_updated_at.isoformat()
        }
    }

