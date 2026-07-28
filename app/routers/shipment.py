from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.websocket.connection_manager import manager


from app.database import get_db
from app.models.shipment import Shipment, ShipmentStatus
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.services.routing_service import generate_route
from app.services.eta_service import calculate_eta
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentResponse,
    ShipmentUpdate,
    ShipmentStatusUpdate,
    ShipmentTrackingUpdate,
    DeliveryConfirmation
)



router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)



# -------------------------
# Generate Tracking Number
# -------------------------

def generate_tracking_number(db: Session):

    last_shipment = (
        db.query(Shipment)
        .order_by(Shipment.id.desc())
        .first()
    )

    if last_shipment:
        number = last_shipment.id + 1
    else:
        number = 1

    return f"FLT{100000 + number}"



# -------------------------
# Create Shipment
# -------------------------

@router.post("/", response_model=ShipmentResponse)
def create_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db)
):

    tracking_number = generate_tracking_number(db)


    new_shipment = Shipment(

        tracking_number=tracking_number,

        sender_name=shipment.sender_name,

        receiver_name=shipment.receiver_name,

        pickup_location=shipment.pickup_location,

        delivery_location=shipment.delivery_location,

        weight=shipment.weight,

        driver_id=shipment.driver_id,

        vehicle_id=shipment.vehicle_id,

        status=shipment.status
    )


    db.add(new_shipment)

    db.commit()

    db.refresh(new_shipment)


    return new_shipment



# -------------------------
# Get All Shipments
# -------------------------

@router.get("/", response_model=list[ShipmentResponse])
def get_shipments(
    db: Session = Depends(get_db)
):

    return db.query(Shipment).all()



# -------------------------
# Get Shipment By ID
# -------------------------

@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )


    if not shipment:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )


    return shipment



# -------------------------
# Update Shipment
# -------------------------

@router.put("/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(
    shipment_id:int,
    shipment:ShipmentUpdate,
    db:Session=Depends(get_db)
):

    db_shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()


    if db_shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )


    update_data = shipment.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_shipment, key, value)


    db.commit()
    db.refresh(db_shipment)

    return db_shipment


# -------------------------
# Delete Shipment
# -------------------------

@router.delete("/{shipment_id}")
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )


    if not shipment:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )


    db.delete(shipment)

    db.commit()


    return {
        "message": "Shipment deleted successfully"
    }
@router.patch("/{shipment_id}/status")
async def update_status(
    shipment_id: int,
    status_update: ShipmentStatusUpdate,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    # Update shipment status
    shipment.status = status_update.status

    db.commit()
    db.refresh(shipment)

    # Find the trip associated with this shipment
    trip = db.query(Trip).filter(
        Trip.shipment_id == shipment.id
    ).first()
    print(f"Trip Found: {trip}")

    # Broadcast the status update to all connected clients
    if trip:
        print("Broadcasting shipment status...")
        await manager.broadcast(
            trip.id,
            {
                "type": "shipment_status",
                "trip_id": trip.id,
                "shipment_id": shipment.id,
                "tracking_number": shipment.tracking_number,
                "status": shipment.status.value if hasattr(shipment.status, "value") else shipment.status
            }
        )

    return {
        "message": "Status updated successfully"
    }
@router.patch("/{shipment_id}/tracking")
def update_tracking(
    shipment_id: int,
    tracking: ShipmentTrackingUpdate,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    shipment.current_location = tracking.current_location
    shipment.status = tracking.status

    db.commit()
    db.refresh(shipment)

    return {
        "message": "Tracking updated successfully"
    }
@router.patch("/{shipment_id}/deliver")
def confirm_delivery(
    shipment_id: int,
    delivery: DeliveryConfirmation,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    shipment.receiver_name = delivery.receiver_name
    shipment.delivery_date = delivery.delivery_date
    shipment.delivery_notes = delivery.delivery_notes
    shipment.status = ShipmentStatus.DELIVERED

    db.commit()
    db.refresh(shipment)

    return {
        "message": "Shipment delivered successfully"
    }
@router.get("/{tracking_number}/status")
def get_shipment_status(
    tracking_number: str,
    db: Session = Depends(get_db)
):
    shipment = (
        db.query(Shipment)
        .filter(Shipment.tracking_number == tracking_number)
        .first()
    )

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    driver = shipment.driver
    vehicle = shipment.vehicle

    trip = (
        db.query(Trip)
        .filter(Trip.shipment_id == shipment.id)
        .first()
    )

    eta = None

    if (
        trip
        and trip.pickup_latitude is not None
        and trip.pickup_longitude is not None
        and trip.destination_latitude is not None
        and trip.destination_longitude is not None
    ):

        route = generate_route(
            trip.pickup_latitude,
            trip.pickup_longitude,
            trip.destination_latitude,
            trip.destination_longitude
        )

        eta = calculate_eta(route["duration_seconds"])

    return {
        "tracking_number": shipment.tracking_number,
        "current_status": shipment.status.value,
        "driver_name": (
            driver.full_name if driver else None
        ),
        "vehicle_registration_number": (
            vehicle.vehicle_number if vehicle else None
        ),
        "pickup_location": shipment.pickup_location,
        "destination": shipment.delivery_location,
        "eta": (
            eta["estimated_arrival"]
            if eta else None
        )
    }