<<<<<<< HEAD

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Shipment, Driver, Vehicle, Trip
from app.enums import ShipmentStatus

from app.dependencies import (
    fleet_operations_required,
    shipment_view_required
)

from app.services.route_service import get_route
from app.services.eta_service import calculate_eta
from app.connection_manager import manager

=======
from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Shipment
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)


<<<<<<< HEAD
# =========================================================
# DATABASE
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# CREATE SHIPMENT
# Administrator / Fleet Manager / Dispatcher
# =========================================================

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
    user=Depends(fleet_operations_required),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Validate Driver
    # -----------------------------------------------------

    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # Driver must be Available
    if driver.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Driver is not available"
        )

    # -----------------------------------------------------
    # Validate Vehicle
    # -----------------------------------------------------

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Vehicle must be Available
    if vehicle.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available"
        )

    # -----------------------------------------------------
    # Validate Weight
    # -----------------------------------------------------

    if weight <= 0:
        raise HTTPException(
            status_code=400,
            detail="Weight must be greater than zero"
        )

    # -----------------------------------------------------
    # Generate Tracking Number
    # -----------------------------------------------------

    last_shipment = (
        db.query(Shipment)
        .order_by(Shipment.shipment_id.desc())
        .first()
    )

    if last_shipment:
        tracking_number = (
            f"FLT{100000 + last_shipment.shipment_id + 1}"
        )
    else:
        tracking_number = "FLT100001"

    # -----------------------------------------------------
    # Create Shipment
    # -----------------------------------------------------

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
=======
@router.post("/")
def create_shipment(
    source: str,
    destination: str,
    shipment_type: str,
    weight: float,
    status: str,
    driver_id: int,
    vehicle_id: int
):
    db = SessionLocal()

    shipment = Shipment(
        source=source,
        destination=destination,
        shipment_type=shipment_type,
        weight=weight,
        status=status,
        driver_id=driver_id,
        vehicle_id=vehicle_id
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    )

    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    return {
        "message": "Shipment created successfully",
        "shipment": shipment
    }


<<<<<<< HEAD
# =========================================================
# GET ALL SHIPMENTS
# Administrator / Fleet Manager / Dispatcher / Driver
# =========================================================

@router.get("/")
def get_all_shipments(
    user=Depends(shipment_view_required),
    db: Session = Depends(get_db)
):

    return db.query(Shipment).all()


# =========================================================
# GET SHIPMENT BY ID
# Administrator / Fleet Manager / Dispatcher / Driver
# =========================================================

@router.get("/{shipment_id}")
def get_shipment(
    shipment_id: int,
    user=Depends(shipment_view_required),
    db: Session = Depends(get_db)
):

    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    return shipment


# =========================================================
# UPDATE SHIPMENT
# Administrator / Fleet Manager / Dispatcher
# =========================================================

@router.put("/{shipment_id}")
async def update_shipment(
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
    user=Depends(fleet_operations_required),
    db: Session = Depends(get_db)
):

    # ==========================================
    # FIND SHIPMENT
    # ==========================================

    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    # ==========================================
    # VALIDATE WEIGHT
    # ==========================================

    if weight <= 0:
        raise HTTPException(
            status_code=400,
            detail="Weight must be greater than zero"
        )

    # ==========================================
    # VALIDATE DRIVER
    # ==========================================

    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # If changing driver, new driver must be available
    if driver_id != shipment.driver_id:

        if driver.status != "Available":
            raise HTTPException(
                status_code=400,
                detail="Driver is not available"
            )

    # ==========================================
    # VALIDATE VEHICLE
    # ==========================================

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # If changing vehicle, new vehicle must be available
    if vehicle_id != shipment.vehicle_id:

        if vehicle.status != "Available":
            raise HTTPException(
                status_code=400,
                detail="Vehicle is not available"
            )

    # ==========================================
    # UPDATE SHIPMENT
    # ==========================================

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

    # ==========================================
    # SAVE DATABASE
    # ==========================================
=======
@router.get("/")
def get_shipments():
    db = SessionLocal()

    shipments = db.query(Shipment).all()

    return shipments


@router.put("/{shipment_id}")
def update_shipment(
    shipment_id: int,
    source: str,
    destination: str,
    shipment_type: str,
    weight: float,
    status: str,
    driver_id: int,
    vehicle_id: int
):
    db = SessionLocal()

    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment not found"}

    shipment.source = source
    shipment.destination = destination
    shipment.shipment_type = shipment_type
    shipment.weight = weight
    shipment.status = status
    shipment.driver_id = driver_id
    shipment.vehicle_id = vehicle_id
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

    db.commit()
    db.refresh(shipment)

<<<<<<< HEAD
    # ==========================================
    # BROADCAST UPDATE
    # ==========================================

    try:

        await manager.broadcast({
            "tracking_number": shipment.tracking_number,
            "shipment_id": shipment.shipment_id,
            "current_status": shipment.current_status.value
        })

    except Exception as e:

        print(
            "WebSocket broadcast error:",
            e
        )

    # ==========================================
    # RESPONSE
    # ==========================================

=======
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    return {
        "message": "Shipment updated successfully",
        "shipment": shipment
    }

<<<<<<< HEAD
# =========================================================
# DELETE SHIPMENT
# Administrator / Fleet Manager / Dispatcher
# =========================================================

@router.delete("/{shipment_id}")
def delete_shipment(
    shipment_id: int,
    user=Depends(fleet_operations_required),
    db: Session = Depends(get_db)
):

    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )
=======

@router.delete("/{shipment_id}")
def delete_shipment(shipment_id: int):
    db = SessionLocal()

    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment not found"}
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

    db.delete(shipment)
    db.commit()

    return {
        "message": "Shipment deleted successfully"
    }


<<<<<<< HEAD
# =========================================================
# TRACK SHIPMENT STATUS
# Administrator / Fleet Manager / Dispatcher / Driver
# =========================================================

@router.get("/{tracking_number}/status")
def track_shipment(
    tracking_number: str,
    user=Depends(shipment_view_required),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find Shipment
    # -----------------------------------------------------

    shipment = db.query(Shipment).filter(
        Shipment.tracking_number == tracking_number
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    # -----------------------------------------------------
    # Find Driver
    # -----------------------------------------------------

    driver = db.query(Driver).filter(
        Driver.driver_id == shipment.driver_id
    ).first()

    # -----------------------------------------------------
    # Find Vehicle
    # -----------------------------------------------------

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == shipment.vehicle_id
    ).first()

    # -----------------------------------------------------
    # Find Trip
    # -----------------------------------------------------

    trip = db.query(Trip).filter(
        Trip.shipment_id == shipment.shipment_id
    ).first()

    eta = "Not Available"

    # -----------------------------------------------------
    # Calculate ETA
    # -----------------------------------------------------

    if trip:

        if (
            trip.pickup_latitude is not None
            and
            trip.pickup_longitude is not None
            and
            trip.destination_latitude is not None
            and
            trip.destination_longitude is not None
        ):

            route = get_route(
                trip.pickup_latitude,
                trip.pickup_longitude,
                trip.destination_latitude,
                trip.destination_longitude
            )

            if route:

                eta_data = calculate_eta(
    route["estimated_duration_minutes"]
)


    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "tracking_number": shipment.tracking_number,

        "current_shipment_status":
            shipment.current_status,

        "driver_name":
            driver.name if driver else None,

        "vehicle_registration_number":
            vehicle.vehicle_number
            if vehicle
            else None,

        "pickup_location":
            shipment.pickup_location,

        "destination":
            shipment.delivery_location,

        "eta": eta
=======
@router.put("/{shipment_id}/eta")
def update_eta(shipment_id: int, eta: str):
    db = SessionLocal()

    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        return {"message": "Shipment not found"}

    shipment.eta = eta

    db.commit()
    db.refresh(shipment)

    return {
        "message": "ETA updated successfully",
        "shipment_id": shipment_id,
        "eta": shipment.eta
    }


@router.get("/{shipment_id}/eta")
def get_eta(shipment_id: int):
    db = SessionLocal()

    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        return {
            "message": "Shipment not found"
        }

    return {
        "shipment_id": shipment.id,
        "eta": shipment.eta
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    }