from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.driver import Driver
from app.models.vehicle import Vehicle

from app.schemas.shipment import ShipmentCreate, ShipmentUpdate

from app.services.eta_service import calculate_eta

router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)


# ----------------------------
# Create Shipment
# ----------------------------
@router.post("/")
def create_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(Shipment).filter(
        Shipment.tracking_id == shipment.tracking_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Shipment with this tracking ID already exists"
        )

    new_shipment = Shipment(**shipment.model_dump())

    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)

    return new_shipment


# ----------------------------
# Get All Shipments
# ----------------------------
@router.get("/")
def get_shipments(db: Session = Depends(get_db)):
    return db.query(Shipment).all()


# ----------------------------
# Track Shipment
# ----------------------------
@router.get("/track/{tracking_id}")
def track_shipment(
    tracking_id: str,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.tracking_id == tracking_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Tracking ID not found"
        )

    return {
        "tracking_id": shipment.tracking_id,
        "origin": shipment.origin,
        "destination": shipment.destination,
        "status": shipment.status
    }


# ----------------------------
# Shipment Status API
# ----------------------------
@router.get("/track/{tracking_number}/status")
def shipment_status(
    tracking_number: str,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.tracking_id == tracking_number
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    trip = db.query(Trip).filter(
        Trip.shipment_id == shipment.id
    ).first()

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    driver = db.query(Driver).filter(
        Driver.id == trip.driver_id
    ).first()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == trip.vehicle_id
    ).first()

    eta = calculate_eta(
        float(trip.current_latitude),
        float(trip.current_longitude),
        float(trip.destination_latitude),
        float(trip.destination_longitude)
    )

    return {
        "tracking_number": shipment.tracking_id,
        "shipment_status": shipment.status,
        "driver_name": driver.name if driver else None,
        "vehicle_registration_number": vehicle.vehicle_number if vehicle else None,
        "pickup_location": shipment.origin,
        "destination": shipment.destination,
        "eta": eta
    }


# ----------------------------
# Get Shipment by ID
# ----------------------------
@router.get("/{shipment_id}")
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    return shipment


# ----------------------------
# Update Shipment
# ----------------------------
@router.put("/{shipment_id}")
def update_shipment(
    shipment_id: int,
    updated: ShipmentUpdate,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    for key, value in updated.model_dump(exclude_unset=True).items():
        setattr(shipment, key, value)

    db.commit()
    db.refresh(shipment)

    return shipment


# ----------------------------
# Update Shipment Status
# ----------------------------
@router.patch("/{shipment_id}/status")
def update_shipment_status(
    shipment_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    shipment.status = status

    db.commit()
    db.refresh(shipment)

    return {
        "message": "Shipment status updated successfully",
        "shipment": shipment
    }


# ----------------------------
# Delete Shipment
# ----------------------------
@router.delete("/{shipment_id}")
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

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