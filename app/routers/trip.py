from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.services.trip_service import (
    create_trip,
    get_all_trips,
    get_trip,
    update_trip,
    delete_trip,
)

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


@router.post("/", response_model=TripResponse)
def add_trip(trip: TripCreate, db: Session = Depends(get_db)):
    return create_trip(trip, db)


@router.get("/", response_model=list[TripResponse])
def fetch_trips(db: Session = Depends(get_db)):
    return get_all_trips(db)


@router.get("/{trip_id}", response_model=TripResponse)
def fetch_trip(trip_id: int, db: Session = Depends(get_db)):
    return get_trip(trip_id, db)


@router.put("/{trip_id}", response_model=TripResponse)
def edit_trip(trip_id: int, trip: TripUpdate, db: Session = Depends(get_db)):
    return update_trip(trip_id, trip, db)


@router.delete("/{trip_id}")
def remove_trip(trip_id: int, db: Session = Depends(get_db)):
    return delete_trip(trip_id, db)