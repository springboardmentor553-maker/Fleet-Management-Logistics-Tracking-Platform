from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.shipment import Shipment
from app.models.vehicle import Vehicle
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate


def create_shipment(shipment: ShipmentCreate, db: Session):

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == shipment.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    new_shipment = Shipment(**shipment.model_dump())

    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)

    return new_shipment


def get_all_shipments(db: Session):
    return db.query(Shipment).all()


def get_shipment(shipment_id: int, db: Session):

    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    return shipment


def update_shipment(shipment_id: int, shipment: ShipmentUpdate, db: Session):

    db_shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == shipment.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    for key, value in shipment.model_dump().items():
        setattr(db_shipment, key, value)

    db.commit()
    db.refresh(db_shipment)

    return db_shipment


def delete_shipment(shipment_id: int, db: Session):

    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    db.delete(shipment)
    db.commit()

    return {"message": "Shipment deleted successfully"}