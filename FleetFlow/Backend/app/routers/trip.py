from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.schemas.trip import TripCreate, TripStatusUpdate, TripResponse
from app.services.trip import get_all_trips, get_trip, create_trip, update_trip_status, delete_trip

router = APIRouter(prefix="/trips", tags=["Trips"])

_trip_roles = require_roles(Role.ADMIN, Role.FLEET_MANAGER, Role.DISPATCHER)


@router.get("/", response_model=list[TripResponse])
def list_trips(db: Session = Depends(get_db), _: User = Depends(_trip_roles)):
    return get_all_trips(db)


@router.get("/{trip_id}", response_model=TripResponse)
def read_trip(trip_id: int, db: Session = Depends(get_db), _: User = Depends(_trip_roles)):
    return get_trip(trip_id, db)


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def add_trip(data: TripCreate, db: Session = Depends(get_db), _: User = Depends(_trip_roles)):
    return create_trip(data, db)


@router.patch("/{trip_id}/status", response_model=TripResponse)
def change_status(trip_id: int, data: TripStatusUpdate, db: Session = Depends(get_db), _: User = Depends(_trip_roles)):
    return update_trip_status(trip_id, data.status, db)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_trip(trip_id: int, db: Session = Depends(get_db), _: User = Depends(_trip_roles)):
    delete_trip(trip_id, db)
