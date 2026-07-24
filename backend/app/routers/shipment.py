import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Shipment, Driver, Vehicle, Trip
from app.enums import ShipmentStatus
from app.dependencies import dispatcher_required

from app.services.route_service import get_route
from app.services.eta_service import calculate_eta
from app.connection_manager import manager

router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# CREATE SHIPMENT
@router.post("/")
def create_shipment(
    shipment_type: str,
    weight: float,
    driver_id: int,
    vehicle_id: int,
    eta: str,
    sender_name: str,
    receiver_name: str,
    pickup_location: str,
    delivery_location: str,
    current_status: ShipmentStatus,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    # Validate Driver
    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
        return {"message": "Driver not found"}

    # Validate Vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    # Generate Tracking Number
    last_shipment = db.query(Shipment).order_by(
        Shipment.shipment_id.desc()
    ).first()

    if last_shipment:
        tracking_number = f"FLT{100000 + last_shipment.shipment_id + 1}"
    else:
        tracking_number = "FLT100001"

    shipment = Shipment(
        shipment_type=shipment_type,
        weight=weight,
        driver_id=driver_id,
        vehicle_id=vehicle_id,
        eta=eta,
        tracking_number=tracking_number,
        sender_name=sender_name,
        receiver_name=receiver_name,
        pickup_location=pickup_location,
        delivery_location=delivery_location,
        current_status=current_status
    )

    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    return {
        "message": "Shipment created successfully",
        "shipment": shipment
    }


# GET ALL SHIPMENTS
@router.get("/")
def get_all_shipments(
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):
    return db.query(Shipment).all()


# GET SHIPMENT BY ID
@router.get("/{shipment_id}")
def get_shipment(
    shipment_id: int,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment not found"}

    return shipment


# UPDATE SHIPMENT
@router.put("/{shipment_id}")
def update_shipment(
    shipment_id: int,
    shipment_type: str,
    weight: float,
    driver_id: int,
    vehicle_id: int,
    eta: str,
    tracking_number: str,
    sender_name: str,
    receiver_name: str,
    pickup_location: str,
    delivery_location: str,
    current_status: ShipmentStatus,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment not found"}

    # Validate Driver
    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
        return {"message": "Driver not found"}

    # Validate Vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    shipment.shipment_type = shipment_type
    shipment.weight = weight
    shipment.driver_id = driver_id
    shipment.vehicle_id = vehicle_id
    shipment.eta = eta
    shipment.tracking_number = tracking_number
    shipment.sender_name = sender_name
    shipment.receiver_name = receiver_name
    shipment.pickup_location = pickup_location
    shipment.delivery_location = delivery_location
    shipment.current_status = current_status

    db.commit()
    db.refresh(shipment)
   

    asyncio.run(
        manager.broadcast({
            "tracking_number": shipment.tracking_number,
            "shipment_id": shipment.shipment_id,
            "current_status": shipment.current_status.value
        })
    )

    return {
        "message": "Shipment updated successfully",
        "shipment": shipment
    }


# DELETE SHIPMENT
@router.delete("/{shipment_id}")
def delete_shipment(
    shipment_id: int,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment not found"}

    db.delete(shipment)
    db.commit()

    return {
        "message": "Shipment deleted successfully"
    }

@router.get("/{tracking_number}/status")
def track_shipment(
    tracking_number: str,
    user=Depends(dispatcher_required),
    db: Session = Depends(get_db)
):

    shipment = db.query(Shipment).filter(
        Shipment.tracking_number == tracking_number
    ).first()

    if not shipment:
        return {"message": "Shipment not found"}

    driver = db.query(Driver).filter(
        Driver.driver_id == shipment.driver_id
    ).first()

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == shipment.vehicle_id
    ).first()

    trip = db.query(Trip).filter(
        Trip.shipment_id == shipment.shipment_id
    ).first()

    eta = "Not Available"

    if trip:
        route = get_route(
            trip.pickup_latitude,
            trip.pickup_longitude,
            trip.destination_latitude,
            trip.destination_longitude
        )

        if route:
            eta_data = calculate_eta(
                route["distance_km"],
                route["estimated_time_minutes"]
            )
            eta = eta_data["estimated_arrival_time"]

    return {
        "tracking_number": shipment.tracking_number,
        "current_shipment_status": shipment.current_status,
        "driver_name": driver.name if driver else None,
        "vehicle_registration_number": vehicle.vehicle_number if vehicle else None,
        "pickup_location": shipment.pickup_location,
        "destination": shipment.delivery_location,
        "eta": eta
    }