from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.models.trip import Trip

from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.user import User

from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse,
)

from app.services.shipment import (
    get_all_shipments,
    get_shipment_by_id,
    create_shipment,
    update_shipment,
    delete_shipment,
)
from app.connection_manager import manager

router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)

_shipment_roles = require_roles(
    Role.ADMIN,
    Role.FLEET_MANAGER,
    Role.DISPATCHER
)


@router.get("/", response_model=list[ShipmentResponse])
def list_shipments(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return get_all_shipments(db)


@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return get_shipment_by_id(shipment_id, db)


@router.post(
    "/",
    response_model=ShipmentResponse,
    status_code=status.HTTP_201_CREATED
)
def add_shipment(
    data: ShipmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_shipment_roles)
):
    return create_shipment(data, db)


@router.put("/{shipment_id}", response_model=ShipmentResponse)
async def update_shipment_route(
    shipment_id: int,
    data: ShipmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_shipment_roles)
):
    shipment = update_shipment(shipment_id, data, db)

    if data.status is not None:
        trip = db.query(Trip).filter(Trip.shipment_id == shipment.id).first()
        trip_id = trip.id if trip else shipment.id
        await manager.broadcast_status_update(trip_id, shipment.status, shipment_id=shipment.id)

    return shipment


@router.delete("/{shipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipment_route(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_shipment_roles)
):
    delete_shipment(shipment_id, db)