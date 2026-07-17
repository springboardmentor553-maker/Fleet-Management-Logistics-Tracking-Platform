from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse
)
from app.services import shipment as shipment_service
from app.auth.oauth2 import (
    get_current_user,   
    get_current_admin,
)

router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)

@router.post("/", response_model=ShipmentResponse)
def create_new_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    return shipment_service.create_shipment(db, shipment)

@router.get("/", response_model=list[ShipmentResponse])
def get_shipments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    return shipment_service.get_all_shipments(db)

@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    shipment = shipment_service.get_shipment_by_id(
        db,
        shipment_id
    )

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    return shipment

@router.put("/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(
    shipment_id: int,
    shipment: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    updated = shipment_service.update_shipment(
        db,
        shipment_id,
        shipment
    )

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    return updated

@router.delete("/{shipment_id}")
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    deleted = shipment_service.delete_shipment(
        db,
        shipment_id
    )

    if deleted is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    return {
        "message": "Shipment deleted successfully"
    }
