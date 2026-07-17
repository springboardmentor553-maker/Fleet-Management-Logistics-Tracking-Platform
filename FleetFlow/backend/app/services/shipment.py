from sqlalchemy.orm import Session

from app.models.shipment import Shipment
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate
from app.enums.shipment_status import ShipmentStatus

def generate_tracking_number(db: Session):

    last_shipment = (
        db.query(Shipment)
        .order_by(Shipment.id.desc())
        .first()
    )

    if last_shipment:
        next_number = last_shipment.id + 1
    else:
        next_number = 1

    return f"FLT{100000 + next_number}"


def create_shipment(
    db: Session,
    shipment: ShipmentCreate
):

    db_shipment = Shipment(

        tracking_number=generate_tracking_number(db),

        sender_name=shipment.sender_name,

        receiver_name=shipment.receiver_name,

        pickup_location=shipment.pickup_location,

        delivery_location=shipment.delivery_location,

        weight=shipment.weight,

        driver_id=shipment.driver_id,

        vehicle_id=shipment.vehicle_id,

        current_status=ShipmentStatus.CREATED.value
    )

    db.add(db_shipment)

    db.commit()

    db.refresh(db_shipment)

    return db_shipment

def get_all_shipments(db: Session):
    return db.query(Shipment).all()

def get_shipment_by_id(
    db: Session,
    shipment_id: int
):
    return (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )

def update_shipment(
    db: Session,
    shipment_id: int,
    shipment: ShipmentUpdate
):

    db_shipment = get_shipment_by_id(db, shipment_id)

    if not db_shipment:
        return None

    update_data = shipment.model_dump(exclude_unset=True)

    for key, value in update_data.items():

        if key == "current_status":
            value = value.value

        setattr(db_shipment, key, value)

    db.commit()

    db.refresh(db_shipment)

    return db_shipment

def delete_shipment(
    db: Session,
    shipment_id: int
):

    db_shipment = get_shipment_by_id(db, shipment_id)

    if not db_shipment:
        return None

    db.delete(db_shipment)

    db.commit()

    return db_shipment