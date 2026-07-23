from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role
from app.connection_manager import manager
import re

router = APIRouter(prefix="/shipments", tags=["Shipments"])

VALID_STATUSES = ["created", "assigned", "picked_up", "in_transit", "out_for_delivery", "delayed", "delivered", "cancelled"]

# A shipment in any of these statuses is still "in progress" — its vehicle/driver
# are considered busy. Delivered and cancelled shipments no longer occupy anyone.
ACTIVE_SHIPMENT_STATUSES = ["created", "assigned", "picked_up", "in_transit", "out_for_delivery", "delayed"]


def generate_tracking_number(db: Session) -> str:
    existing = db.query(models.Shipment.tracking_id).filter(models.Shipment.tracking_id.like("FLT%")).all()
    max_number = 100000
    for (tid,) in existing:
        match = re.match(r"FLT(\d+)", tid)
        if match:
            num = int(match.group(1))
            if num > max_number:
                max_number = num
    return f"FLT{max_number + 1}"


def validate_shipment_assignment(db: Session, vehicle_id: int, driver_id: int, exclude_shipment_id: int = None):
    """
    Blocks assigning a shipment to:
    - an inactive driver
    - a vehicle under maintenance
    - a vehicle/driver already busy on another active (non-delivered/cancelled) shipment
    """
    if vehicle_id is not None:
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        if vehicle.status == "maintenance":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle {vehicle.registration_number} is under maintenance and cannot be assigned"
            )

        vehicle_query = db.query(models.Shipment).filter(
            models.Shipment.vehicle_id == vehicle_id,
            models.Shipment.status.in_(ACTIVE_SHIPMENT_STATUSES)
        )
        if exclude_shipment_id:
            vehicle_query = vehicle_query.filter(models.Shipment.id != exclude_shipment_id)
        conflict = vehicle_query.first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle {vehicle.registration_number} is already assigned to active shipment {conflict.tracking_id}"
            )

    if driver_id is not None:
        driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
        if not driver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        if driver.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver {driver.name} is inactive and cannot be assigned"
            )

        driver_query = db.query(models.Shipment).filter(
            models.Shipment.driver_id == driver_id,
            models.Shipment.status.in_(ACTIVE_SHIPMENT_STATUSES)
        )
        if exclude_shipment_id:
            driver_query = driver_query.filter(models.Shipment.id != exclude_shipment_id)
        conflict = driver_query.first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver {driver.name} is already assigned to active shipment {conflict.tracking_id}"
            )


async def broadcast_shipment_update(shipment: models.Shipment):
    """Sends the shipment's new status to the global channel, plus to its
    linked trip's channel (if it has one), so anyone watching either updates instantly."""
    status_value = shipment.status.value if hasattr(shipment.status, "value") else shipment.status

    message = {
        "type": "shipment_status_update",
        "shipment_id": shipment.id,
        "tracking_id": shipment.tracking_id,
        "status": status_value,
        "origin": shipment.origin,
        "destination": shipment.destination,
        "vehicle_id": shipment.vehicle_id,
        "driver_id": shipment.driver_id,
    }

    await manager.broadcast(message)

    if shipment.trip is not None:
        await manager.broadcast_to_trip(shipment.trip.id, message)


@router.post("/", response_model=schemas.ShipmentResponse)
def create_shipment(shipment: schemas.ShipmentCreate, db: Session = Depends(get_db)):
    validate_shipment_assignment(db, shipment.vehicle_id, shipment.driver_id)

    tracking_number = generate_tracking_number(db)
    new_shipment = models.Shipment(tracking_id=tracking_number, **shipment.dict())
    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)
    return new_shipment


@router.get("/", response_model=list[schemas.ShipmentResponse])
def list_shipments(db: Session = Depends(get_db)):
    return db.query(models.Shipment).all()


@router.get("/{shipment_id}", response_model=schemas.ShipmentResponse)
def get_shipment(shipment_id: int, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    return shipment


@router.put("/{shipment_id}", response_model=schemas.ShipmentResponse)
async def update_shipment(shipment_id: int, updated: schemas.ShipmentCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

    if updated.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {VALID_STATUSES}")

    validate_shipment_assignment(db, updated.vehicle_id, updated.driver_id, exclude_shipment_id=shipment_id)

    for key, value in updated.dict().items():
        setattr(shipment, key, value)

    db.commit()
    db.refresh(shipment)

    await broadcast_shipment_update(shipment)

    return shipment


@router.put("/{shipment_id}/status", response_model=schemas.ShipmentResponse)
async def update_shipment_status(shipment_id: int, update: schemas.ShipmentStatusUpdate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

    if update.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {VALID_STATUSES}")

    shipment.status = update.status
    db.commit()
    db.refresh(shipment)

    await broadcast_shipment_update(shipment)

    return shipment


@router.delete("/{shipment_id}")
def delete_shipment(shipment_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

    db.delete(shipment)
    db.commit()
    return {"message": "Shipment deleted successfully"}

@router.get("/{tracking_number}/status", response_model=schemas.ShipmentTrackingResponse)
def get_shipment_status(tracking_number: str, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.tracking_id == tracking_number).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

    driver = db.query(models.Driver).filter(models.Driver.id == shipment.driver_id).first() if shipment.driver_id else None
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == shipment.vehicle_id).first() if shipment.vehicle_id else None

    status_value = shipment.status.value if hasattr(shipment.status, "value") else shipment.status

    return {
        "tracking_number": shipment.tracking_id,
        "status": status_value,
        "driver_name": driver.name if driver else None,
        "vehicle_registration": vehicle.registration_number if vehicle else None,
        "pickup_location": shipment.origin,
        "destination": shipment.destination,
        "eta": shipment.eta.strftime("%d %b %Y, %I:%M %p") if shipment.eta else None,
    }