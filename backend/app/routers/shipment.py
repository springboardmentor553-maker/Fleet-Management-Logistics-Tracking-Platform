from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shipment import Shipment
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse
)

from app.utils.audit import create_audit_log
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)


# =====================================================
# GET ALL SHIPMENTS
# =====================================================

@router.get(
    "/",
    response_model=list[ShipmentResponse]
)
def get_shipments(
    db: Session = Depends(get_db)
):

    return db.query(Shipment).all()


# =====================================================
# GET SHIPMENT BY ID
# =====================================================

@router.get(
    "/{shipment_id}",
    response_model=ShipmentResponse
)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == shipment_id
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    return shipment


# =====================================================
# TRACK SHIPMENT
# =====================================================

@router.get(
    "/track/{tracking_id}",
    response_model=ShipmentResponse
)
def track_shipment(
    tracking_id: str,
    db: Session = Depends(get_db)
):

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.tracking_id == tracking_id
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Tracking ID not found"
        )

    return shipment


# =====================================================
# CREATE SHIPMENT
# =====================================================

@router.post(
    "/",
    response_model=ShipmentResponse
)
def create_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -------------------------------------------------
    # CHECK DUPLICATE TRACKING ID
    # -------------------------------------------------

    existing = (
        db.query(Shipment)
        .filter(
            Shipment.tracking_id == shipment.tracking_id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Tracking ID already exists"
        )

    # -------------------------------------------------
    # CREATE SHIPMENT
    # -------------------------------------------------

    shipment_data = shipment.model_dump()

    # Do not allow frontend to send created_at as None.
    # The database model will automatically generate it.
    shipment_data.pop("created_at", None)

    new_shipment = Shipment(
        **shipment_data
    )

    db.add(new_shipment)

    # Generate ID and apply defaults
    db.flush()

    # -------------------------------------------------
    # AUDIT LOG
    # -------------------------------------------------

    create_audit_log(
        db=db,
        user=current_user,
        module="Shipment",
        action="CREATE",
        details=(
            f"Shipment {new_shipment.tracking_id} "
            f"(ID: {new_shipment.id}) was created."
        )
    )

    # -------------------------------------------------
    # COMMIT
    # -------------------------------------------------

    db.commit()

    db.refresh(new_shipment)

    return new_shipment


# =====================================================
# UPDATE SHIPMENT
# =====================================================

@router.put(
    "/{shipment_id}",
    response_model=ShipmentResponse
)
def update_shipment(
    shipment_id: int,
    shipment: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -------------------------------------------------
    # FIND SHIPMENT
    # -------------------------------------------------

    db_shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == shipment_id
        )
        .first()
    )

    if not db_shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    # -------------------------------------------------
    # STORE OLD VALUES
    # -------------------------------------------------

    old_tracking_id = db_shipment.tracking_id
    old_status = db_shipment.status

    # -------------------------------------------------
    # UPDATE ONLY PROVIDED FIELDS
    # -------------------------------------------------

    update_data = shipment.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():

        setattr(
            db_shipment,
            key,
            value
        )

    # -------------------------------------------------
    # AUDIT LOG
    # -------------------------------------------------

    create_audit_log(
        db=db,
        user=current_user,
        module="Shipment",
        action="UPDATE",
        details=(
            f"Shipment ID {db_shipment.id} updated. "
            f"Tracking ID: {old_tracking_id} -> "
            f"{db_shipment.tracking_id}. "
            f"Status: {old_status} -> "
            f"{db_shipment.status}."
        )
    )

    # -------------------------------------------------
    # COMMIT
    # -------------------------------------------------

    db.commit()

    db.refresh(db_shipment)

    return db_shipment


# =====================================================
# DELETE SHIPMENT
# =====================================================

@router.delete(
    "/{shipment_id}"
)
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -------------------------------------------------
    # FIND SHIPMENT
    # -------------------------------------------------

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == shipment_id
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    # -------------------------------------------------
    # CHECK WHETHER SHIPMENT HAS TRIPS
    # -------------------------------------------------

    if shipment.trips:

        raise HTTPException(
            status_code=400,
            detail=(
                "Shipment is assigned to a trip. "
                "Delete the trip first."
            )
        )

    # -------------------------------------------------
    # STORE VALUES BEFORE DELETE
    # -------------------------------------------------

    tracking_id = shipment.tracking_id
    shipment_id_value = shipment.id

    # -------------------------------------------------
    # AUDIT BEFORE DELETE
    # -------------------------------------------------

    create_audit_log(
        db=db,
        user=current_user,
        module="Shipment",
        action="DELETE",
        details=(
            f"Shipment {tracking_id} "
            f"(ID: {shipment_id_value}) was deleted."
        )
    )

    # -------------------------------------------------
    # DELETE
    # -------------------------------------------------

    db.delete(shipment)

    db.commit()

    return {
        "message": "Shipment deleted successfully"
    }