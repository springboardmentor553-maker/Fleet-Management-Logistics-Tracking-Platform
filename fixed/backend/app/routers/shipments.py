from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.connection_manager import manager
from app.database import get_db
from app.routers.crud import commit_or_409
from app.schemas.shipments import (
    ShipmentCreate,
    ShipmentPublicStatusRead,
    ShipmentRead,
    ShipmentUpdate,
)
from app.services.eta_service import calculate_eta

router = APIRouter()
tracking_router = APIRouter()

TRACKING_PREFIX = "FLT"
TRACKING_START = 100001



def generate_tracking_number(db: Session) -> str:
    """Generate the next sequential tracking number, e.g. FLT100001, FLT100002.
    Numbers are derived from the highest tracking number currently in the
    table, so they stay sequential for the life of the data set."""
    existing = (
        db.query(models.Shipment.tracking_number)
        .filter(models.Shipment.tracking_number.like(f"{TRACKING_PREFIX}%"))
        .all()
    )
    max_seq = TRACKING_START - 1
    for (tracking_number,) in existing:
        suffix = tracking_number[len(TRACKING_PREFIX):]
        if suffix.isdigit():
            max_seq = max(max_seq, int(suffix))
    return f"{TRACKING_PREFIX}{max_seq + 1}"


@router.get("/", response_model=list[ShipmentRead])
def list_shipments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get All Shipments"""
    return db.query(models.Shipment).offset(skip).limit(limit).all()


@router.post("/", response_model=ShipmentRead, status_code=status.HTTP_201_CREATED)
def create_shipment(payload: ShipmentCreate, db: Session = Depends(get_db)):
    """Create Shipment — tracking number is always server-generated."""
    data = payload.model_dump()
    data["tracking_number"] = generate_tracking_number(db)
    # Ensure FKs map correctly if passed
    if "vehicle_id" in data and data["vehicle_id"] is not None:
        data["assigned_vehicle_id"] = data.pop("vehicle_id")
    else:
        data.pop("vehicle_id", None)

    if "driver_id" in data and data["driver_id"] is not None:
        data["assigned_driver_id"] = data.pop("driver_id")
    else:
        data.pop("driver_id", None)

    # Filter keys to only attributes defined on Shipment model
    shipment_data = {k: v for k, v in data.items() if hasattr(models.Shipment, k)}

    shipment = models.Shipment(**shipment_data)
    db.add(shipment)
    commit_or_409(db)
    db.refresh(shipment)
    return shipment




@router.get("/{item_id}", response_model=ShipmentRead)
def get_shipment(item_id: int, db: Session = Depends(get_db)):
    """Get Shipment by ID"""
    shipment = db.get(models.Shipment, item_id)
    if shipment is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return shipment


@router.put("/{item_id}", response_model=ShipmentRead)
async def update_shipment(item_id: int, payload: ShipmentUpdate, db: Session = Depends(get_db)):
    """Update Shipment — Task 4: if this shipment is linked to a trip and
    its status changed, immediately broadcast the new status to everyone
    watching that trip over WebSocket."""
    shipment = db.get(models.Shipment, item_id)
    if shipment is None:
        raise HTTPException(status_code=404, detail="Item not found")

    data = payload.model_dump(exclude_unset=True)
    status_changed = "status" in data and data["status"] != shipment.status

    for field, value in data.items():
        setattr(shipment, field, value)

    commit_or_409(db)
    db.refresh(shipment)

    if status_changed:
        trip = (
            db.query(models.Trip)
            .filter(models.Trip.shipment_id == shipment.id)
            .first()
        )
        if trip is not None:
            await manager.broadcast(
                trip.id,
                {
                    "type": "shipment_status",
                    "trip_id": trip.id,
                    "shipment_id": shipment.id,
                    "status": shipment.status,
                },
            )

    return shipment


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipment(item_id: int, db: Session = Depends(get_db)):
    """Delete Shipment"""
    shipment = db.get(models.Shipment, item_id)
    if shipment is None:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(shipment)
    commit_or_409(db)
    return None


@tracking_router.get("/shipment/{tracking_number}/status", response_model=ShipmentPublicStatusRead)
@router.get("/tracking/{tracking_number}/status", response_model=ShipmentPublicStatusRead)
def get_shipment_status_by_tracking_number(tracking_number: str, db: Session = Depends(get_db)):
    """Jul 17 Task 4: Public Shipment Tracking API.
    Returns tracking number, status, driver name, vehicle registration number,
    pickup location, destination, and calculated ETA."""
    shipment = (
        db.query(models.Shipment)
        .filter(models.Shipment.tracking_number == tracking_number)
        .first()
    )
    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shipment with tracking number '{tracking_number}' not found",
        )

    driver_name = shipment.driver.name if shipment.driver else None
    vehicle_reg = shipment.vehicle.vehicle_number if shipment.vehicle else None

    # Check if there is an associated Trip for pickup/destination and ETA
    trip = shipment.trip
    pickup = shipment.pickup_location
    dest = shipment.delivery_location
    eta_text = "N/A"

    if trip:
        pickup = trip.pickup_location or pickup
        dest = trip.destination or dest
        eta_info = calculate_eta(
            duration_seconds=None,
            start_time=trip.scheduled_start_time,
        )
        eta_text = eta_info["eta_formatted"]

    return ShipmentPublicStatusRead(
        tracking_number=shipment.tracking_number,
        status=shipment.status,
        driver_name=driver_name,
        vehicle_registration_number=vehicle_reg,
        pickup_location=pickup,
        destination=dest,
        eta=eta_text,
    )

