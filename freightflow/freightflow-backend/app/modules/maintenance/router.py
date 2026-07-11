from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.enums import AccountRole
from app.common.pagination import Page, PageParams
from app.core.deps import require_roles
from app.db.session import get_db
from app.modules.maintenance import service
from app.modules.maintenance.models import MaintenanceLog
from app.modules.maintenance.schemas import MaintenanceLogCreate, MaintenanceLogOut, MaintenanceLogUpdate

router = APIRouter(prefix="/maintenance", tags=["Vehicle Maintenance"])

_write_access = Depends(require_roles(AccountRole.ADMIN, AccountRole.DISPATCHER))


@router.get("", response_model=Page[MaintenanceLogOut])
def list_logs(
    vehicle_id: int | None = None,
    params: PageParams = Depends(),
    db: Session = Depends(get_db),
) -> Page[MaintenanceLogOut]:
    items, total = service.list_logs(db, params.offset, params.page_size, vehicle_id)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.get("/{log_id}", response_model=MaintenanceLogOut)
def get_log(log_id: int, db: Session = Depends(get_db)) -> MaintenanceLog:
    return service.get_log_or_404(db, log_id)


@router.post("", response_model=MaintenanceLogOut, status_code=status.HTTP_201_CREATED, dependencies=[_write_access])
def create_log(payload: MaintenanceLogCreate, db: Session = Depends(get_db)) -> MaintenanceLog:
    return service.create_log(db, payload)


@router.patch("/{log_id}", response_model=MaintenanceLogOut, dependencies=[_write_access])
def update_log(log_id: int, payload: MaintenanceLogUpdate, db: Session = Depends(get_db)) -> MaintenanceLog:
    return service.update_log(db, log_id, payload)


@router.post("/{log_id}/close", response_model=MaintenanceLogOut, dependencies=[_write_access])
def close_log(log_id: int, db: Session = Depends(get_db)) -> MaintenanceLog:
    return service.close_log(db, log_id)
