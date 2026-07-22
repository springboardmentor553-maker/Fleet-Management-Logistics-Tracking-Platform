from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.user import User
from app.schemas.shipment import ShipmentCreate, ShipmentAssign, ShipmentResponse
from app.services.maps import geocode_location

router = APIRouter(prefix="/dispatcher", tags=["Dispatcher"])

_dispatch_or_admin = require_roles(Role.DISPATCHER, Role.ADMIN)


@router.get("/shipments", response_model=list[ShipmentResponse])
def list_shipments(db: Session = Depends(get_db), _: User = Depends(_dispatch_or_admin)):
    return db.query(Shipment).order_by(Shipment.id).all()


@router.post("/shipments", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
def create_shipment(data: ShipmentCreate, db: Session = Depends(get_db), _: User = Depends(_dispatch_or_admin)):
    shipment = Shipment(**data.model_dump())
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment


@router.patch("/shipments/{shipment_id}/assign", response_model=ShipmentResponse)
def assign_shipment(
    shipment_id: int,
    data: ShipmentAssign,
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    if shipment.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending shipments can be assigned")

    driver = db.query(Driver).filter(Driver.id == data.driver_id, Driver.is_available == True).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver not found or unavailable")

    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id, Vehicle.current_status == "available").first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle not found or unavailable")

    shipment.driver_id = data.driver_id
    shipment.vehicle_id = data.vehicle_id
    shipment.status = "in_transit"
    driver.is_available = False
    vehicle.current_status = "in_transit"

    if shipment.origin_lat is None or shipment.origin_lng is None:
        origin_coords = geocode_location(shipment.origin)
        shipment.origin_lat = origin_coords["latitude"]
        shipment.origin_lng = origin_coords["longitude"]

    if shipment.destination_lat is None or shipment.destination_lng is None:
        destination_coords = geocode_location(shipment.destination)
        shipment.destination_lat = destination_coords["latitude"]
        shipment.destination_lng = destination_coords["longitude"]

    vehicle.latitude = shipment.origin_lat
    vehicle.longitude = shipment.origin_lng

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

    db.commit()
    db.refresh(shipment)
    return shipment


@router.patch("/shipments/{shipment_id}/cancel", response_model=ShipmentResponse)
def cancel_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_dispatch_or_admin),
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    if shipment.status in ("delivered", "cancelled"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel a {shipment.status} shipment")
    # Free up driver and vehicle if assigned
    if shipment.driver_id:
        driver = db.query(Driver).filter(Driver.id == shipment.driver_id).first()
        if driver:
            driver.is_available = True
    if shipment.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == shipment.vehicle_id).first()
        if vehicle:
            vehicle.current_status = "available"
    shipment.status = "cancelled"
    db.commit()
    db.refresh(shipment)
    return shipment
