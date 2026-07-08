from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db
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
    _: User = Depends(_shipment_roles)
):
    return get_all_shipments(db)


@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_shipment_roles)
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
def update_shipment_route(
    shipment_id: int,
    data: ShipmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_shipment_roles)
):
    return update_shipment(shipment_id, data, db)


@router.delete("/{shipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipment_route(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_shipment_roles)
):
    delete_shipment(shipment_id, db)