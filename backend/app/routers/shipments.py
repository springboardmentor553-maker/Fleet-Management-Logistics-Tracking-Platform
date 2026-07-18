from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role
import re

router = APIRouter(prefix="/shipments", tags=["Shipments"])

VALID_STATUSES = ["created", "assigned", "picked_up", "in_transit", "out_for_delivery", "delayed", "delivered", "cancelled"]

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

@router.post("/", response_model=schemas.ShipmentResponse)
def create_shipment(shipment: schemas.ShipmentCreate, db: Session = Depends(get_db)):
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


@router.put("/{shipment_id}/status", response_model=schemas.ShipmentResponse)
def update_shipment_status(shipment_id: int, update: schemas.ShipmentStatusUpdate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

    if update.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {VALID_STATUSES}")

    shipment.status = update.status
    db.commit()
    db.refresh(shipment)
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