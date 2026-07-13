from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role

router = APIRouter(prefix="/trips", tags=["Trips"])

VALID_STATUSES = ["scheduled", "ongoing", "completed", "cancelled"]


@router.post("/", response_model=schemas.TripResponse)
def create_trip(trip: schemas.TripCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    driver = db.query(models.Driver).filter(models.Driver.id == trip.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    new_trip = models.Trip(**trip.dict())
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip


@router.get("/", response_model=list[schemas.TripResponse])
def list_trips(db: Session = Depends(get_db)):
    return db.query(models.Trip).order_by(models.Trip.scheduled_start.desc()).all()


@router.get("/{trip_id}", response_model=schemas.TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


@router.put("/{trip_id}", response_model=schemas.TripResponse)
def update_trip(trip_id: int, updated: schemas.TripCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    for key, value in updated.dict().items():
        setattr(trip, key, value)

    db.commit()
    db.refresh(trip)
    return trip


@router.put("/{trip_id}/status", response_model=schemas.TripResponse)
def update_trip_status(trip_id: int, update: schemas.TripStatusUpdate, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if update.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {VALID_STATUSES}")

    trip.status = update.status
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully"}