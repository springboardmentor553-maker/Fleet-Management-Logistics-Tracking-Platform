from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.enums import AccountRole, ShipmentStatus
from app.common.pagination import Page, PageParams
from app.core.deps import require_roles
from app.db.session import get_db
from app.modules.shipments import service
from app.modules.shipments.models import Shipment
from app.modules.shipments.schemas import ShipmentAssign, ShipmentCreate, ShipmentOut, ShipmentUpdate

router = APIRouter(prefix="/shipments", tags=["Shipment Management"])

_write_access = Depends(require_roles(AccountRole.ADMIN, AccountRole.DISPATCHER))


@router.get("", response_model=Page[ShipmentOut])
def list_shipments(
    status_filter: ShipmentStatus | None = None,
    params: PageParams = Depends(),
    db: Session = Depends(get_db),
) -> Page[ShipmentOut]:
    items, total = service.list_shipments(db, params.offset, params.page_size, status_filter)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.get("/{shipment_id}", response_model=ShipmentOut)
def get_shipment(shipment_id: int, db: Session = Depends(get_db)) -> Shipment:
    return service.get_shipment_or_404(db, shipment_id)


@router.post("", response_model=ShipmentOut, status_code=status.HTTP_201_CREATED, dependencies=[_write_access])
def create_shipment(payload: ShipmentCreate, db: Session = Depends(get_db)) -> Shipment:
    return service.create_shipment(db, payload)


@router.patch("/{shipment_id}", response_model=ShipmentOut, dependencies=[_write_access])
def update_shipment(shipment_id: int, payload: ShipmentUpdate, db: Session = Depends(get_db)) -> Shipment:
    return service.update_shipment(db, shipment_id, payload)


@router.post("/{shipment_id}/assign", response_model=ShipmentOut, dependencies=[_write_access])
def assign_shipment(shipment_id: int, payload: ShipmentAssign, db: Session = Depends(get_db)) -> Shipment:
    return service.assign_shipment(db, shipment_id, payload)


@router.post("/{shipment_id}/start-transit", response_model=ShipmentOut, dependencies=[_write_access])
def start_transit(shipment_id: int, db: Session = Depends(get_db)) -> Shipment:
    return service.mark_in_transit(db, shipment_id)


@router.post("/{shipment_id}/deliver", response_model=ShipmentOut, dependencies=[_write_access])
def deliver_shipment(shipment_id: int, db: Session = Depends(get_db)) -> Shipment:
    return service.mark_delivered(db, shipment_id)


@router.post("/{shipment_id}/cancel", response_model=ShipmentOut, dependencies=[_write_access])
def cancel_shipment(shipment_id: int, db: Session = Depends(get_db)) -> Shipment:
    return service.cancel_shipment(db, shipment_id)
