
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.enums import AccountRole, TripStatus
from app.common.pagination import Page, PageParams
from app.core.deps import require_roles
from app.db.session import get_db
from app.modules.trips import service
from app.modules.trips.models import Trip
from app.modules.trips.schemas import TripCreate, TripOut, TripUpdate

router = APIRouter(prefix="/trips", tags=["Trip Management"])

_write_access = Depends(require_roles(AccountRole.ADMIN, AccountRole.DISPATCHER))


@router.get("", response_model=Page[TripOut])
def list_trips(
    status_filter: TripStatus | None = None,
    params: PageParams = Depends(),
    db: Session = Depends(get_db),
) -> Page[TripOut]:
    items, total = service.list_trips(db, params.offset, params.page_size, status_filter)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db)) -> Trip:
    return service.get_trip_or_404(db, trip_id)


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED, dependencies=[_write_access])
def create_trip(payload: TripCreate, db: Session = Depends(get_db)) -> Trip:
    return service.create_trip(db, payload)


@router.patch("/{trip_id}", response_model=TripOut, dependencies=[_write_access])
def update_trip(trip_id: int, payload: TripUpdate, db: Session = Depends(get_db)) -> Trip:
    return service.update_trip(db, trip_id, payload)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_write_access])
def delete_trip(trip_id: int, db: Session = Depends(get_db)) -> None:
    service.delete_trip(db, trip_id)
