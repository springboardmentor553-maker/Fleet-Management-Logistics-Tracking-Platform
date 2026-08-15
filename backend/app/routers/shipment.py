from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shipment import Shipment

from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse,
)

from app.services.notification_service import (
    create_notification,
)

from app.services.status_sync_service import (
    sync_all_trip_shipment_statuses,
)


# ==========================================================
# ROUTER
# ==========================================================

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

    # First shipment
    if last_shipment is None:
        return "FLT100001"

    # Try to get previous tracking number
    try:

        last_number = int(
            last_shipment.tracking_number.replace(
                "FLT",
                ""
            )
        )

    except (ValueError, AttributeError):

        last_number = 100000

    # IMPORTANT:
    # This must be on ONE line.
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

    # ------------------------------------------------------
    # B6 STATUS SYNCHRONIZATION
    # ------------------------------------------------------
    # Synchronize Trip status with Shipment status
    # before returning shipment data.
    # ------------------------------------------------------

    try:

        sync_all_trip_shipment_statuses(
            db
        )

    except Exception as error:

        print(
            "SHIPMENT STATUS SYNC ERROR:",
            error
        )

        # Do not stop the shipment page from loading
        # if synchronization has an unexpected problem.

        db.rollback()

    # ------------------------------------------------------
    # Get shipments
    # ------------------------------------------------------

    shipments = (
        db.query(Shipment)
        .order_by(
            Shipment.id.desc()
        )
        .all()
    )

    return shipments


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

    # ------------------------------------------------------
    # B6 STATUS SYNCHRONIZATION
    # ------------------------------------------------------

    try:

        sync_all_trip_shipment_statuses(
            db
        )

    except Exception as error:

        print(
            "SHIPMENT STATUS SYNC ERROR:",
            error
        )

        db.rollback()

    # ------------------------------------------------------
    # Find shipment
    # ------------------------------------------------------

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == shipment_id
        )
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

    try:

        # --------------------------------------------------
        # Convert Pydantic model to dictionary
        # --------------------------------------------------

        shipment_data = (
            shipment.model_dump()
        )

        # --------------------------------------------------
        # Generate tracking number automatically
        # --------------------------------------------------

        shipment_data["tracking_number"] = (
            generate_tracking_number(db)
        )

        # --------------------------------------------------
        # Set initial shipment status
        # --------------------------------------------------
        # A newly created shipment starts as Created.
        # It will become Assigned automatically when
        # a Trip is created for it.
        # --------------------------------------------------

        if not shipment_data.get(
            "current_status"
        ):

            shipment_data[
                "current_status"
            ] = "Created"

        # --------------------------------------------------
        # Create database object
        # --------------------------------------------------

        new_shipment = Shipment(
            **shipment_data
        )

        # --------------------------------------------------
        # Save shipment
        # --------------------------------------------------

        db.add(new_shipment)

        db.commit()

        db.refresh(new_shipment)

        # --------------------------------------------------
        # Notification
        # --------------------------------------------------

        create_notification(

            db=db,

            title="New Shipment Added",

            message=(
                f"{new_shipment.tracking_number} "
                "created successfully."
            ),

            type="success",

        )

        return new_shipment

    except Exception as error:

        db.rollback()

        print(
            "CREATE SHIPMENT ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create shipment",
        )


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

    # ------------------------------------------------------
    # Find shipment
    # ------------------------------------------------------

    db_shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == shipment_id
        )
        .first()
    )

    if db_shipment is None:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    try:

        # --------------------------------------------------
        # Convert update data
        # --------------------------------------------------

        shipment_data = (
            shipment.model_dump(
                exclude_unset=True
            )
        )

        # --------------------------------------------------
        # Tracking number must never be changed
        # --------------------------------------------------

        shipment_data.pop(
            "tracking_number",
            None
        )

        # --------------------------------------------------
        # Update fields
        # --------------------------------------------------

        for key, value in shipment_data.items():

            setattr(
                db_shipment,
                key,
                value
            )

        # --------------------------------------------------
        # Save changes
        # --------------------------------------------------

        db.commit()

        db.refresh(
            db_shipment
        )

        # --------------------------------------------------
        # Notification
        # --------------------------------------------------

        create_notification(

            db=db,

            title="Shipment Updated",

            message=(
                f"{db_shipment.tracking_number} "
                "updated successfully."
            ),

            type="info",

        )

        return db_shipment

    except Exception as error:

        db.rollback()

        print(
            "UPDATE SHIPMENT ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update shipment",
        )


# ==========================================================
# DELETE SHIPMENT
# ==========================================================

@router.delete(
    "/{shipment_id}"
)
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
):

    # ------------------------------------------------------
    # Find shipment
    # ------------------------------------------------------

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == shipment_id
        )
        .first()
    )

    if shipment is None:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    try:

        # --------------------------------------------------
        # Save tracking number before deletion
        # --------------------------------------------------

        tracking_number = (
            shipment.tracking_number
        )

        # --------------------------------------------------
        # Delete shipment
        # --------------------------------------------------

        db.delete(
            shipment
        )

        db.commit()

        # --------------------------------------------------
        # Notification
        # --------------------------------------------------

        create_notification(

            db=db,

            title="Shipment Deleted",

            message=(
                f"{tracking_number} "
                "deleted successfully."
            ),

            type="warning",

        )

        return {

            "message":
                "Shipment deleted successfully",

            "shipment_id":
                shipment_id,

        }

    except Exception as error:

        db.rollback()

        print(
            "DELETE SHIPMENT ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete shipment",
        )