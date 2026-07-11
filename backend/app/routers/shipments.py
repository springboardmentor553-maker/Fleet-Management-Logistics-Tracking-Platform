from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role

router = APIRouter(prefix="/shipments", tags=["Shipments"])

VALID_STATUSES = ["created", "assigned", "in_transit", "delayed", "delivered", "cancelled"]


@router.post("/", response_model=schemas.ShipmentResponse)
def create_shipment(shipment: schemas.ShipmentCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    existing = db.query(models.Shipment).filter(
        models.Shipment.tracking_id == shipment.tracking_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tracking ID already exists")

    new_shipment = models.Shipment(**shipment.dict())
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