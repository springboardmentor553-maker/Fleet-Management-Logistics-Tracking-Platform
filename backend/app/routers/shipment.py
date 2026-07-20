from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.notification_service import create_notification
from app.database import get_db
from app.models.shipment import Shipment
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse,
)

router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"],
)


# ==========================================================
# GENERATE TRACKING NUMBER
# ==========================================================

def generate_tracking_number(db: Session):

    last_shipment = (
        db.query(Shipment)
        .order_by(Shipment.id.desc())
        .first()
    )

    if last_shipment is None:

        return "FLT100001"

    try:

        last_number = int(
            last_shipment.tracking_number.replace("FLT", "")
        )

    except Exception:

        last_number = 100000

    next_number = last_number + 1

    return f"FLT{next_number}"


# ==========================================================
# GET ALL SHIPMENTS
# ==========================================================

@router.get(
    "/",
    response_model=list[ShipmentResponse],
)
def get_shipments(
    db: Session = Depends(get_db),
):

    return db.query(Shipment).all()


# ==========================================================
# GET SHIPMENT BY ID
# ==========================================================

@router.get(
    "/{shipment_id}",
    response_model=ShipmentResponse,
)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
):

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )

    if shipment is None:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    return shipment

# ==========================================================
# CREATE SHIPMENT
# ==========================================================

@router.post(
    "/",
    response_model=ShipmentResponse,
    status_code=201,
)
def create_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db),
):

    shipment_data = shipment.model_dump()

    # Automatically Generate Tracking Number
    shipment_data["tracking_number"] = generate_tracking_number(db)

    new_shipment = Shipment(

        **shipment_data

    )

    db.add(new_shipment)

    db.commit()

    db.refresh(new_shipment)

    create_notification(

    db=db,

    title="New Shipment Added",

    message=f"{new_shipment.tracking_number} created successfully.",

    type="success"

    )

    return new_shipment


# ==========================================================
# UPDATE SHIPMENT
# ==========================================================

@router.put(
    "/{shipment_id}",
    response_model=ShipmentResponse,
)
def update_shipment(
    shipment_id: int,
    shipment: ShipmentUpdate,
    db: Session = Depends(get_db),
):

    db_shipment = (

        db.query(Shipment)

        .filter(Shipment.id == shipment_id)

        .first()

    )

    if db_shipment is None:

        raise HTTPException(

            status_code=404,

            detail="Shipment not found",

        )

    shipment_data = shipment.model_dump()

    # Don't allow changing Tracking Number
    shipment_data.pop("tracking_number", None)

    for key, value in shipment_data.items():

        setattr(db_shipment, key, value)

    db.commit()

    db.refresh(db_shipment)
    create_notification(

    db=db,

    title="Shipment Updated",

    message=f"{db_shipment.tracking_number} updated successfully.",

    type="info"

    )

    return db_shipment


# ==========================================================
# DELETE SHIPMENT
# ==========================================================

@router.delete("/{shipment_id}")
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
):

    shipment = (

        db.query(Shipment)

        .filter(Shipment.id == shipment_id)

        .first()

    )

    if shipment is None:

        raise HTTPException(

            status_code=404,

            detail="Shipment not found",

        )
    create_notification(

    db=db,

    title="Shipment Deleted",

    message=f"{shipment.tracking_number} deleted successfully.",

    type="warning"

    )

    db.delete(shipment)

    db.commit()

    return {

        "message": "Shipment deleted successfully"

    }