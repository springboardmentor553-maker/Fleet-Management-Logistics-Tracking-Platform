from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.enums import AccountRole
from app.core.deps import get_current_account, require_roles
from app.db.session import get_db
from app.modules.accounts.models import Account
from app.modules.routes_ops import service
from app.modules.routes_ops.models import TripRoute
from app.modules.routes_ops.schemas import TripRouteCreate, TripRouteOut, TripRouteUpdate

router = APIRouter(prefix="/routes", tags=["Route Management"])

_write_access = Depends(require_roles(AccountRole.ADMIN, AccountRole.DISPATCHER))


@router.get("/shipment/{shipment_id}", response_model=TripRouteOut)
def get_route_for_shipment(shipment_id: int, db: Session = Depends(get_db)) -> TripRoute:
    return service.get_route_for_shipment(db, shipment_id)


@router.get("/{route_id}", response_model=TripRouteOut)
def get_route(route_id: int, db: Session = Depends(get_db)) -> TripRoute:
    return service.get_route_or_404(db, route_id)


@router.post("", response_model=TripRouteOut, status_code=status.HTTP_201_CREATED, dependencies=[_write_access])
def create_route(
    payload: TripRouteCreate,
    db: Session = Depends(get_db),
    current: Account = Depends(get_current_account),
) -> TripRoute:
    return service.create_route(db, payload, planned_by=current.id)


@router.patch("/{route_id}", response_model=TripRouteOut, dependencies=[_write_access])
def update_route(route_id: int, payload: TripRouteUpdate, db: Session = Depends(get_db)) -> TripRoute:
    return service.update_route(db, route_id, payload)


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_write_access])
def delete_route(route_id: int, db: Session = Depends(get_db)) -> None:
    service.delete_route(db, route_id)
