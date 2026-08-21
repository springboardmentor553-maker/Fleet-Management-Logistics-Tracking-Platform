from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.shipment import Shipment
from app.services.maps import get_route
from app.services.eta_service import calculate_eta

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
    try:
        return shipment_service.create_shipment(
            db,
            shipment
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.get("/", response_model=list[ShipmentResponse])
def get_shipments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    return shipment_service.get_all_shipments(db)

@router.get("/{tracking_number}/status")
def get_shipment_tracking(
    tracking_number: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.tracking_number == tracking_number
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    route = get_route(
        shipment.pickup_location,
        shipment.delivery_location
    )

    eta = calculate_eta(
        route["duration_minutes"]
    )

    return {
        "tracking_number": shipment.tracking_number,
        "current_status": shipment.current_status,
        "driver_name": shipment.driver.name if shipment.driver else None,
        "vehicle_registration_number": (
            shipment.vehicle.registration_number
            if shipment.vehicle
            else None
        ),
        "pickup_location": shipment.pickup_location,
        "destination": shipment.delivery_location,
        "eta": eta
    }

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
    try:
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

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

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
