from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.shipment import Shipment
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate
from app.services.maps import geocode_location


def _sync_location_coordinates(shipment: Shipment, *, origin_changed: bool = False, destination_changed: bool = False) -> None:
    if origin_changed or shipment.origin_lat is None or shipment.origin_lng is None:
        origin_coords = geocode_location(shipment.origin)
        shipment.origin_lat = origin_coords["latitude"]
        shipment.origin_lng = origin_coords["longitude"]

    if destination_changed or shipment.destination_lat is None or shipment.destination_lng is None:
        destination_coords = geocode_location(shipment.destination)
        shipment.destination_lat = destination_coords["latitude"]
        shipment.destination_lng = destination_coords["longitude"]


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
    _sync_location_coordinates(shipment, origin_changed=True, destination_changed=True)
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment


def update_shipment(shipment_id: int, data: ShipmentUpdate, db: Session) -> Shipment:
    shipment = get_shipment_by_id(shipment_id, db)

    changes = data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(shipment, field, value)

    _sync_location_coordinates(
        shipment,
        origin_changed="origin" in changes,
        destination_changed="destination" in changes,
    )

    db.commit()
    db.refresh(shipment)

    return shipment


def delete_shipment(shipment_id: int, db: Session) -> None:
    shipment = get_shipment_by_id(shipment_id, db)

    db.delete(shipment)
    db.commit()