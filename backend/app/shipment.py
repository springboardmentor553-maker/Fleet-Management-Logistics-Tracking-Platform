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
    new_shipment = Shipment(
        source=shipment.source,
        destination=shipment.destination,
        status=shipment.status,
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