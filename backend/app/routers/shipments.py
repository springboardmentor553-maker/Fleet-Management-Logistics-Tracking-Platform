from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas.shipments import (
    ShipmentCreate,
    ShipmentRead,
    ShipmentUpdate,
)


router = APIRouter()


# =========================================================
# GET ALL SHIPMENTS
# =========================================================

@router.get("/", response_model=list[ShipmentRead])
def get_shipments(
    db: Session = Depends(get_db),
):
    shipments = (
        db.query(models.Shipment)
        .order_by(models.Shipment.id)
        .all()
    )

    return shipments


# =========================================================
# GET SINGLE SHIPMENT
# =========================================================

@router.get("/{shipment_id}", response_model=ShipmentRead)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
):
    shipment = (
        db.query(models.Shipment)
        .filter(models.Shipment.id == shipment_id)
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    return shipment


# =========================================================
# CREATE SHIPMENT
# =========================================================

@router.post("/", response_model=ShipmentRead, status_code=201)
def create_shipment(
    data: ShipmentCreate,
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # Check tracking number
    # -----------------------------------------------------

    existing = (
        db.query(models.Shipment)
        .filter(
            models.Shipment.tracking_number
            == data.tracking_number
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Tracking number already exists",
        )

    # -----------------------------------------------------
    # Create shipment
    # -----------------------------------------------------

    shipment = models.Shipment(
        tracking_number=data.tracking_number,
        sender_name=data.sender_name,
        receiver_name=data.receiver_name,
        pickup_location=data.pickup_location,
        delivery_location=data.delivery_location,
        current_status=data.current_status,
        weight=data.weight,
        assigned_driver_id=data.assigned_driver_id,
        assigned_vehicle_id=data.assigned_vehicle_id,
        created_date=datetime.now(timezone.utc),
    )

    db.add(shipment)

    try:
        db.commit()
        db.refresh(shipment)

    except IntegrityError as exc:
        db.rollback()

        message = str(exc.orig).lower()

        if "foreign key" in message:
            raise HTTPException(
                status_code=400,
                detail="Assigned driver or vehicle does not exist",
            ) from exc

        if "unique" in message or "duplicate" in message:
            raise HTTPException(
                status_code=400,
                detail="Tracking number already exists",
            ) from exc

        raise HTTPException(
            status_code=409,
            detail="Database constraint failed",
        ) from exc

    return shipment


# =========================================================
# UPDATE SHIPMENT
# =========================================================

@router.put("/{shipment_id}", response_model=ShipmentRead)
def update_shipment(
    shipment_id: int,
    data: ShipmentUpdate,
    db: Session = Depends(get_db),
):
    shipment = (
        db.query(models.Shipment)
        .filter(
            models.Shipment.id == shipment_id
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    values = data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Check tracking number uniqueness
    # -----------------------------------------------------

    if "tracking_number" in values:

        existing = (
            db.query(models.Shipment)
            .filter(
                models.Shipment.tracking_number
                == values["tracking_number"],
                models.Shipment.id
                != shipment_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Tracking number already exists",
            )

    # -----------------------------------------------------
    # Update fields
    # -----------------------------------------------------

    for field, value in values.items():
        setattr(
            shipment,
            field,
            value,
        )

    try:
        db.commit()
        db.refresh(shipment)

    except IntegrityError as exc:
        db.rollback()

        message = str(exc.orig).lower()

        if "foreign key" in message:
            raise HTTPException(
                status_code=400,
                detail="Assigned driver or vehicle does not exist",
            ) from exc

        if "unique" in message or "duplicate" in message:
            raise HTTPException(
                status_code=400,
                detail="Tracking number already exists",
            ) from exc

        raise HTTPException(
            status_code=409,
            detail="Database constraint failed",
        ) from exc

    return shipment


# =========================================================
# DELETE SHIPMENT
# =========================================================

@router.delete("/{shipment_id}")
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
):
    shipment = (
        db.query(models.Shipment)
        .filter(
            models.Shipment.id == shipment_id
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    # -----------------------------------------------------
    # Check whether a Trip uses this shipment
    # -----------------------------------------------------

    trip = (
        db.query(models.Trip)
        .filter(
            models.Trip.shipment_id
            == shipment_id
        )
        .first()
    )

    if trip:
        raise HTTPException(
            status_code=409,
            detail=(
                "Shipment cannot be deleted because "
                f"it is assigned to Trip {trip.id}. "
                "Delete or update the trip first."
            ),
        )

    # -----------------------------------------------------
    # Delete shipment
    # -----------------------------------------------------

    try:
        db.delete(shipment)
        db.commit()

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Shipment cannot be deleted because "
                "another record is using it."
            ),
        ) from exc

    return {
        "message": "Shipment deleted successfully"
    }