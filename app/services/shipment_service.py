from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.shipment import Shipment
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate

from app.services.notification_service import create_notification


# =====================================
# Create Shipment
# =====================================

def create_shipment(shipment: ShipmentCreate, db: Session):

    new_shipment = Shipment(**shipment.model_dump())

    db.add(new_shipment)

    create_notification(
        db=db,
        title="New Shipment Created",
        message=f"Shipment '{shipment.shipment_name}' has been created successfully.",
        type="success"
    )

    db.commit()
    db.refresh(new_shipment)

    return new_shipment


# =====================================
# Get All Shipments
# =====================================

def get_all_shipments(db: Session):

    return db.query(Shipment).all()


# =====================================
# Get Shipment
# =====================================

def get_shipment(shipment_id: int, db: Session):

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    return shipment


# =====================================
# Update Shipment
# =====================================

def update_shipment(
    shipment_id: int,
    shipment: ShipmentUpdate,
    db: Session
):

    db_shipment = (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )

    if not db_shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    old_status = db_shipment.status

    for key, value in shipment.model_dump().items():
        setattr(db_shipment, key, value)

    # Shipment Delivered
    if shipment.status.lower() == "delivered":

        create_notification(
            db=db,
            title="Shipment Delivered",
            message=f"Shipment '{shipment.shipment_name}' has been delivered successfully.",
            type="success"
        )

    # Status Changed
    elif old_status != shipment.status:

        create_notification(
            db=db,
            title="Shipment Status Updated",
            message=f"Shipment '{shipment.shipment_name}' status changed from '{old_status}' to '{shipment.status}'.",
            type="info"
        )

    # General Update
    else:

        create_notification(
            db=db,
            title="Shipment Updated",
            message=f"Shipment '{shipment.shipment_name}' information has been updated.",
            type="info"
        )

    db.commit()
    db.refresh(db_shipment)

    return db_shipment


# =====================================
# Delete Shipment
# =====================================

def delete_shipment(
    shipment_id: int,
    db: Session
):

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    shipment_name = shipment.shipment_name

    create_notification(
        db=db,
        title="Shipment Deleted",
        message=f"Shipment '{shipment_name}' has been deleted.",
        type="warning"
    )

    db.delete(shipment)

    db.commit()

    return {
        "message": "Shipment deleted successfully"
    }