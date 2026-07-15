from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role

router = APIRouter(prefix="/trips", tags=["Trips"])

VALID_STATUSES = ["scheduled", "ongoing", "completed", "cancelled"]
ACTIVE_STATUSES = ["scheduled", "ongoing"]


def check_double_assignment(db: Session, driver_id: int, vehicle_id: int, exclude_trip_id: int = None):
    driver_query = db.query(models.Trip).filter(
        models.Trip.driver_id == driver_id,
        models.Trip.status.in_(ACTIVE_STATUSES)
    )
    if exclude_trip_id:
        driver_query = driver_query.filter(models.Trip.id != exclude_trip_id)
    existing_driver_trip = driver_query.first()
    if existing_driver_trip:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver already has an active trip (#{existing_driver_trip.id}: {existing_driver_trip.origin} to {existing_driver_trip.destination})"
        )

    vehicle_query = db.query(models.Trip).filter(
        models.Trip.vehicle_id == vehicle_id,
        models.Trip.status.in_(ACTIVE_STATUSES)
    )
    if exclude_trip_id:
        vehicle_query = vehicle_query.filter(models.Trip.id != exclude_trip_id)
    existing_vehicle_trip = vehicle_query.first()
    if existing_vehicle_trip:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle already has an active trip (#{existing_vehicle_trip.id}: {existing_vehicle_trip.origin} to {existing_vehicle_trip.destination})"
        )


@router.post("/", response_model=schemas.TripResponse)
def create_trip(trip: schemas.TripCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    driver = db.query(models.Driver).filter(models.Driver.id == trip.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    if trip.shipment_id is not None:
        shipment = db.query(models.Shipment).filter(models.Shipment.id == trip.shipment_id).first()
        if not shipment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

        existing_trip_for_shipment = db.query(models.Trip).filter(models.Trip.shipment_id == trip.shipment_id).first()
        if existing_trip_for_shipment:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This shipment is already linked to another trip")

    if trip.status in ACTIVE_STATUSES:
        check_double_assignment(db, trip.driver_id, trip.vehicle_id)

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

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == updated.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    driver = db.query(models.Driver).filter(models.Driver.id == updated.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    if updated.shipment_id is not None:
        shipment = db.query(models.Shipment).filter(models.Shipment.id == updated.shipment_id).first()
        if not shipment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

    if updated.status in ACTIVE_STATUSES:
        check_double_assignment(db, updated.driver_id, updated.vehicle_id, exclude_trip_id=trip_id)

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

    if update.status in ACTIVE_STATUSES:
        check_double_assignment(db, trip.driver_id, trip.vehicle_id, exclude_trip_id=trip_id)

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