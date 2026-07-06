from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse
)
from app.services.shipment_service import (
    create_shipment,
    get_all_shipments,
    get_shipment,
    update_shipment,
    delete_shipment
)

router = APIRouter(
    prefix="/shipments",
    tags=["Shipment Management"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ShipmentResponse)
def add_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db)
):
    return create_shipment(shipment, db)


@router.get("/", response_model=List[ShipmentResponse])
def fetch_all_shipments(
    db: Session = Depends(get_db)
):
    return get_all_shipments(db)


@router.get("/{shipment_id}", response_model=ShipmentResponse)
def fetch_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):
    return get_shipment(shipment_id, db)


@router.put("/{shipment_id}", response_model=ShipmentResponse)
def edit_shipment(
    shipment_id: int,
    shipment: ShipmentUpdate,
    db: Session = Depends(get_db)
):
    return update_shipment(shipment_id, shipment, db)


@router.delete("/{shipment_id}")
def remove_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):
    return delete_shipment(shipment_id, db)