from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.enums import AccountRole, DriverStatus
from app.common.pagination import Page, PageParams
from app.core.deps import require_roles
from app.db.session import get_db
from app.modules.drivers import service
from app.modules.drivers.models import Driver
from app.modules.drivers.schemas import DriverCreate, DriverOut, DriverUpdate

router = APIRouter(prefix="/drivers", tags=["Driver Management"])

_write_access = Depends(require_roles(AccountRole.ADMIN, AccountRole.DISPATCHER))


@router.get("", response_model=Page[DriverOut])
def list_drivers(
    status_filter: DriverStatus | None = None,
    params: PageParams = Depends(),
    db: Session = Depends(get_db),
) -> Page[DriverOut]:
    items, total = service.list_drivers(db, params.offset, params.page_size, status_filter)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(driver_id: int, db: Session = Depends(get_db)) -> Driver:
    return service.get_driver_or_404(db, driver_id)


@router.post("", response_model=DriverOut, status_code=status.HTTP_201_CREATED, dependencies=[_write_access])
def create_driver(payload: DriverCreate, db: Session = Depends(get_db)) -> Driver:
    return service.create_driver(db, payload)


@router.patch("/{driver_id}", response_model=DriverOut, dependencies=[_write_access])
def update_driver(driver_id: int, payload: DriverUpdate, db: Session = Depends(get_db)) -> Driver:
    return service.update_driver(db, driver_id, payload)


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_write_access])
def delete_driver(driver_id: int, db: Session = Depends(get_db)) -> None:
    service.delete_driver(db, driver_id)
