from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.shipment import Shipment
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate


def get_all_shipments(db: Session) -> list[Shipment]:
    return db.query(Shipment).order_by(Shipment.id).all()


def get_shipment_by_id(shipment_id: int, db: Session) -> Shipment:
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found"
        )
    return shipment


def create_shipment(data: ShipmentCreate, db: Session) -> Shipment:
    shipment = Shipment(**data.model_dump())
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment


def update_shipment(shipment_id: int, data: ShipmentUpdate, db: Session) -> Shipment:
    shipment = get_shipment_by_id(shipment_id, db)

    changes = data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(shipment, field, value)

    db.commit()
    db.refresh(shipment)

    return shipment


def delete_shipment(shipment_id: int, db: Session) -> None:
    shipment = get_shipment_by_id(shipment_id, db)

    db.delete(shipment)
    db.commit()