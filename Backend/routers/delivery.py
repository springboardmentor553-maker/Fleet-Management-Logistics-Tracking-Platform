from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.delivery import Delivery
from app.models.shipment import Shipment
from app.schemas.delivery import DeliveryCreate, DeliveryResponse

router = APIRouter(
    prefix="/deliveries",
    tags=["Deliveries"]
)

# Create Delivery
@router.post("/", response_model=DeliveryResponse)
def create_delivery(delivery: DeliveryCreate, db: Session = Depends(get_db)):
    # Check if shipment exists
    shipment = db.query(Shipment).filter(
        Shipment.id == delivery.shipment_id
    ).first()

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    new_delivery = Delivery(**delivery.model_dump())

    db.add(new_delivery)
    db.commit()
    db.refresh(new_delivery)

    return new_delivery


# Get All Deliveries
@router.get("/", response_model=list[DeliveryResponse])
def get_deliveries(db: Session = Depends(get_db)):
    return db.query(Delivery).all()

@router.get("/status-report", response_model=list[DeliveryResponse])
def delivery_status_report(
    status: str,
    db: Session = Depends(get_db)
):
    deliveries = db.query(Delivery).filter(
        Delivery.delivery_status == status
    ).all()

    return deliveries

# Get Delivery by ID
@router.get("/{delivery_id}", response_model=DeliveryResponse)
def get_delivery(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id
    ).first()

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found"
        )

    return delivery


# Update Delivery
@router.put("/{delivery_id}", response_model=DeliveryResponse)
def update_delivery(
    delivery_id: int,
    delivery: DeliveryCreate,
    db: Session = Depends(get_db)
):
    db_delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id
    ).first()

    if not db_delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found"
        )

    for key, value in delivery.model_dump().items():
        setattr(db_delivery, key, value)

    db.commit()
    db.refresh(db_delivery)

    return db_delivery


# Delete Delivery
@router.delete("/{delivery_id}")
def delete_delivery(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id
    ).first()

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found"
        )

    db.delete(delivery)
    db.commit()

    return {"message": "Delivery deleted successfully"}