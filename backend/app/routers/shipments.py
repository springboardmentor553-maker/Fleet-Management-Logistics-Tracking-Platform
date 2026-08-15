from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.driver import Driver
from app.models.shipment import Shipment, ShipmentStatus
from app.schemas.fleet import ShipmentCreate, ShipmentUpdate, ShipmentResponse
from app.services.shipment import ShipmentService
from app.utils.dependencies import get_current_active_user, require_admin, require_dispatcher, require_driver_or_higher

router = APIRouter(prefix="/shipments", tags=["Shipments"])

def get_shipment_service(db: Session = Depends(get_db)) -> ShipmentService:
    """Dependency to retrieve ShipmentService."""
    return ShipmentService(db)

@router.get("", response_model=list[ShipmentResponse], dependencies=[Depends(require_driver_or_higher)])
def get_shipments(
    service: ShipmentService = Depends(get_shipment_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get shipments:
    - Admin, Fleet Managers, and Dispatchers get all shipments.
    - Drivers only get shipments assigned to them.
    """
    if current_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER]:
        return service.get_all()
    
    elif current_user.role == UserRole.DRIVER:
        # Find driver profile
        driver = service.db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver:
            return []
        return service.get_by_driver(driver.id)
    
    return []

@router.post("", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_dispatcher)])
def create_shipment(
    shipment_data: ShipmentCreate,
    service: ShipmentService = Depends(get_shipment_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new shipment (Admins, Fleet Managers, and Dispatchers only).
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create shipments."
        )
    return service.create_shipment(shipment_data)

@router.get("/{shipment_id}", response_model=ShipmentResponse, dependencies=[Depends(require_driver_or_higher)])
def get_shipment(
    shipment_id: int,
    service: ShipmentService = Depends(get_shipment_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific shipment.
    - Drivers can only see their own assigned shipments.
    """
    shipment = service.get_by_id(shipment_id)

    if current_user.role == UserRole.DRIVER:
        driver = service.db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or shipment.assigned_driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this shipment."
            )

    return shipment

@router.put("/{shipment_id}", response_model=ShipmentResponse, dependencies=[Depends(require_driver_or_higher)])
def update_shipment(
    shipment_id: int,
    shipment_data: ShipmentUpdate,
    background_tasks: BackgroundTasks,
    service: ShipmentService = Depends(get_shipment_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a shipment:
    - Admins, Fleet Managers, and Dispatchers can update any shipment attributes.
    - Drivers can ONLY update the status of shipments assigned to them.
    """
    shipment = service.get_by_id(shipment_id)
    update_dict = shipment_data.model_dump(exclude_unset=True)

    if current_user.role == UserRole.DRIVER:
        # Check ownership
        driver = service.db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or shipment.assigned_driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this shipment."
            )
        
        # Drivers can ONLY update the status field (accepting both status and current_status)
        allowed_keys = {"status", "current_status"}
        if not set(update_dict.keys()).issubset(allowed_keys):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Drivers are only allowed to update the status of their assigned shipment."
            )
    else:
        # Admin, Manager, Dispatcher checks
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update shipments."
            )

    return service.update_shipment(shipment_id, shipment_data, background_tasks)

@router.delete("/{shipment_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_shipment(
    shipment_id: int,
    service: ShipmentService = Depends(get_shipment_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a shipment (Admins and Fleet Managers only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete shipments."
        )

    service.delete_shipment(shipment_id)
    return None

@router.get("/{tracking_number}/status")
def get_shipment_status(
    tracking_number: str,
    service: ShipmentService = Depends(get_shipment_service)
):
    """
    Get public status of a shipment by tracking number. No auth required.
    """
    shipment = service.get_by_tracking_number(tracking_number)
    
    eta = None
    progress = 0.0
    trip = shipment.trip
    if trip:
        from app.services.eta_service import ETAService
        from datetime import datetime, timezone
        
        start_time = trip.created_at
        if trip.trip_status == app.models.trip.TripStatus.IN_TRANSIT:
            start_time = datetime.now(timezone.utc)
            
        eta_obj = ETAService.calculate_eta(start_time, trip.estimated_duration)
        if eta_obj:
            eta = eta_obj.isoformat()
            
        # Calculate progress realistically based on time elapsed versus estimated duration
        if shipment.current_status == ShipmentStatus.DELIVERED:
            progress = 1.0
        elif shipment.current_status in [ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY] and eta_obj:
            now = datetime.now(timezone.utc)
            total_duration = (eta_obj - trip.created_at).total_seconds()
            elapsed = (now - trip.created_at).total_seconds()
            
            if total_duration > 0:
                calc_progress = elapsed / total_duration
                # Cap progress at 0.95 until actually delivered
                progress = max(0.0, min(0.95, calc_progress))
        elif shipment.current_status == ShipmentStatus.OUT_FOR_DELIVERY:
            progress = 0.9 # Fallback if no ETA obj
        elif shipment.current_status == ShipmentStatus.IN_TRANSIT:
            progress = 0.5 # Fallback if no ETA obj
            
    return {
        "tracking_number": shipment.tracking_number,
        "shipment_status": shipment.current_status.value,
        "driver_name": shipment.driver.user_name if shipment.driver else None,
        "vehicle_number": shipment.vehicle.license_plate if shipment.vehicle else None,
        "pickup": shipment.pickup_location,
        "destination": shipment.delivery_location,
        "eta": eta
    }
