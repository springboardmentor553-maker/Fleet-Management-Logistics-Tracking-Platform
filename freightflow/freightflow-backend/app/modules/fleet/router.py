from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.enums import AccountRole, VehicleStatus
from app.common.pagination import Page, PageParams
from app.core.deps import require_roles
from app.db.session import get_db
from app.modules.fleet import service
from app.modules.fleet.models import Vehicle
from app.modules.fleet.schemas import VehicleCreate, VehicleOut, VehicleUpdate

router = APIRouter(prefix="/vehicles", tags=["Fleet Management"])

_write_access = Depends(require_roles(AccountRole.ADMIN, AccountRole.DISPATCHER))


@router.get("", response_model=Page[VehicleOut])
def list_vehicles(
    status_filter: VehicleStatus | None = None,
    params: PageParams = Depends(),
    db: Session = Depends(get_db),
) -> Page[VehicleOut]:
    items, total = service.list_vehicles(db, params.offset, params.page_size, status_filter)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)) -> Vehicle:
    return service.get_vehicle_or_404(db, vehicle_id)


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED, dependencies=[_write_access])
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)) -> Vehicle:
    return service.create_vehicle(db, payload)


@router.patch("/{vehicle_id}", response_model=VehicleOut, dependencies=[_write_access])
def update_vehicle(vehicle_id: int, payload: VehicleUpdate, db: Session = Depends(get_db)) -> Vehicle:
    return service.update_vehicle(db, vehicle_id, payload)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_write_access])
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)) -> None:
    service.delete_vehicle(db, vehicle_id)
