from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles

from app.models.user import User
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.driver_assignment import DriverAssignment

from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentAssign,
    ShipmentResponse,
)

from app.services.maps import geocode_location

router = APIRouter(
    prefix="/dispatcher",
    tags=["Dispatcher"]
)

_dispatch_or_admin = require_roles(
    Role.DISPATCHER,
    Role.ADMIN
)


@router.get("/shipments", response_model=list[ShipmentResponse])
def list_shipments(
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):
    return db.query(Shipment).order_by(Shipment.id).all()


@router.post(
    "/shipments",
    response_model=ShipmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_shipment(
    data: ShipmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):
    shipment = Shipment(**data.model_dump())
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment


@router.patch(
    "/shipments/{shipment_id}/assign",
    response_model=ShipmentResponse,
)
def assign_shipment(
    shipment_id: int,
    data: ShipmentAssign,
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    if shipment.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending shipments can be assigned",
        )

    driver = db.query(Driver).filter(
        Driver.id == data.driver_id,
        Driver.is_available == True
    ).first()

    if not driver:
        raise HTTPException(
            status_code=400,
            detail="Driver not found or unavailable",
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == data.vehicle_id,
        Vehicle.current_status == "available",
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=400,
            detail="Vehicle not found or unavailable",
        )

    # Update shipment
    shipment.driver_id = driver.id
    shipment.vehicle_id = vehicle.id
    shipment.status = "in_transit"

    # Update driver
    driver.is_available = False
    driver.assigned_vehicle_id = vehicle.id

    # Update vehicle
    vehicle.current_status = "in_transit"
    vehicle.assigned_driver_id = driver.id

    # Geocode origin
    if shipment.origin_lat is None or shipment.origin_lng is None:
        origin = geocode_location(shipment.origin)
        shipment.origin_lat = origin["latitude"]
        shipment.origin_lng = origin["longitude"]

    # Geocode destination
    if shipment.destination_lat is None or shipment.destination_lng is None:
        destination = geocode_location(shipment.destination)
        shipment.destination_lat = destination["latitude"]
        shipment.destination_lng = destination["longitude"]

    # Vehicle current location
    vehicle.latitude = shipment.origin_lat
    vehicle.longitude = shipment.origin_lng

    # Create Trip
    trip = Trip(
        shipment_id=shipment.id,
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        pickup_latitude=shipment.origin_lat,
        pickup_longitude=shipment.origin_lng,
        destination_latitude=shipment.destination_lat,
        destination_longitude=shipment.destination_lng,
        status="scheduled",
    )

    db.add(trip)

    # Generate trip.id
    db.flush()

    # Create Driver Assignment
    assignment = DriverAssignment(
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        trip_id=trip.id,
        assignment_date=datetime.utcnow(),
        assignment_status="Assigned",
        remarks="Assigned from Dispatcher",
    )

    db.add(assignment)

    db.commit()

    db.refresh(shipment)

    return shipment


@router.patch(
    "/shipments/{shipment_id}/cancel",
    response_model=ShipmentResponse,
)
def cancel_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    if shipment.status in ("delivered", "cancelled"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a {shipment.status} shipment",
        )

    if shipment.driver_id:
        driver = db.query(Driver).filter(
            Driver.id == shipment.driver_id
        ).first()

        if driver:
            driver.is_available = True
            driver.assigned_vehicle_id = None

    if shipment.vehicle_id:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == shipment.vehicle_id
        ).first()

        if vehicle:
            vehicle.current_status = "available"
            vehicle.assigned_driver_id = None

    shipment.status = "cancelled"

    db.commit()

    db.refresh(shipment)

    return shipment