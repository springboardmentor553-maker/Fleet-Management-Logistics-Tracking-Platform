from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.common import MessageResponse

from app.dependencies import (
    get_db,
    require_role,
)

from app.models.user import User
from app.models.shipment import Shipment

from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse,
)

from datetime import datetime

router = APIRouter()


# -----------------------------
# Add Shipment
# Admin Only
# -----------------------------
@router.post("/", response_model=ShipmentResponse)
def add_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    shipment_count = db.query(Shipment).count() + 1

    tracking_number = f"FLT{shipment_count:06d}"

    new_shipment = Shipment(
        tracking_number=tracking_number,
        sender_name=shipment.sender_name,
        receiver_name=shipment.receiver_name,
        pickup_location=shipment.pickup_location,
        delivery_location=shipment.delivery_location,
        status=shipment.status,
        weight=shipment.weight,
        created_date=datetime.utcnow(),
        assigned_driver_id=shipment.assigned_driver_id,
        assigned_vehicle_id=shipment.assigned_vehicle_id,
    )

    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)

    return new_shipment


# -----------------------------
# View All Shipments
# Admin + Fleet Manager + Dispatcher
# -----------------------------
@router.get("/", response_model=list[ShipmentResponse])
def get_all_shipments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
        )
    )
):
    return db.query(Shipment).all()


# -----------------------------
# View Single Shipment
# Admin + Fleet Manager + Dispatcher + Driver
# -----------------------------
@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
            "driver",
        )
    )
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found."
        )

    return shipment


# -----------------------------
# Update Shipment
# Admin + Fleet Manager
# -----------------------------
@router.put("/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(
    shipment_id: int,
    shipment: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    )
):
    db_shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not db_shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found."
        )

    update_data = shipment.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_shipment, key, value)

    db.commit()
    db.refresh(db_shipment)

    return db_shipment


# -----------------------------
# Delete Shipment
# Admin Only
# -----------------------------
@router.delete("/{shipment_id}", response_model=MessageResponse)
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    db_shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id
    ).first()

    if not db_shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found."
        )

    db.delete(db_shipment)
    db.commit()

    return {
        "message": "Shipment deleted successfully."
    }