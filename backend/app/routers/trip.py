from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.services import trip_service
from app.utils.security import has_role
from app.models.driver import Driver
from app.models.trip import Trip

router = APIRouter(
    prefix="/trips",
    tags=["Trip Management"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def add_trip(trip: TripCreate, db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Dispatcher"]))):
    return trip_service.create_trip(trip, db)


@router.get("/", response_model=List[TripResponse])
def fetch_all_trips(db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Dispatcher", "Driver"]))):
    if current_user.role == "Driver":
        driver = db.query(Driver).filter(Driver.name.ilike(current_user.name)).first()
        if not driver:
            return []
        return db.query(Trip).filter(Trip.driver_id == driver.id).all()
    return trip_service.get_all_trips(db)


@router.get("/{id}", response_model=TripResponse)
def fetch_trip(id: int, db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Dispatcher", "Driver"]))):
    trip = trip_service.get_trip(id, db)
    if current_user.role == "Driver":
        driver = db.query(Driver).filter(Driver.name.ilike(current_user.name)).first()
        if not driver or trip.driver_id != driver.id:
            raise HTTPException(status_code=403, detail="You do not have access to this resource")
    return trip


@router.put("/{id}", response_model=TripResponse)
def edit_trip(id: int, trip: TripUpdate, db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Dispatcher"]))):
    return trip_service.update_trip(id, trip, db)


@router.delete("/{id}")
def remove_trip(id: int, db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Dispatcher"]))):
    return trip_service.delete_trip(id, db)

