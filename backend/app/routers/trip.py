from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate
import math
from app.utils.route_optimizer import optimize_route

router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)


@router.post("/")
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):
    new_trip = Trip(**trip.model_dump())

    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    return new_trip


@router.get("/")
def get_trips(db: Session = Depends(get_db)):
    return db.query(Trip).all()


@router.get("/{trip_id}")
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    return trip


@router.put("/{trip_id}")
def update_trip(
    trip_id: int,
    updated: TripUpdate,
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    for key, value in updated.model_dump(exclude_unset=True).items():
        setattr(trip, key, value)

    db.commit()
    db.refresh(trip)

    return trip


@router.delete("/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    db.delete(trip)
    db.commit()

    return {"message": "Trip deleted successfully"}

@router.patch("/{trip_id}/location")
def update_trip_location(
    trip_id: int,
    current_latitude: str,
    current_longitude: str,
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.current_latitude = current_latitude
    trip.current_longitude = current_longitude

    db.commit()
    db.refresh(trip)

    return {
        "message": "Location updated successfully",
        "trip": trip
    }

@router.get("/{trip_id}/tracking")
def track_trip(
    trip_id: int,
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    return {
        "trip_id": trip.id,
        "shipment_id": trip.shipment_id,
        "vehicle_id": trip.vehicle_id,
        "driver_id": trip.driver_id,
        "current_location": {
            "latitude": trip.current_latitude,
            "longitude": trip.current_longitude
        },
        "destination": {
            "latitude": trip.destination_latitude,
            "longitude": trip.destination_longitude
        },
        "status": trip.status
    }

@router.get("/{trip_id}/eta")
def calculate_eta(
    trip_id: int,
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    try:
        current_lat = float(trip.current_latitude)
        current_lon = float(trip.current_longitude)
        dest_lat = float(trip.destination_latitude)
        dest_lon = float(trip.destination_longitude)

        # Simple Euclidean distance (for demonstration)
        distance = math.sqrt(
            (dest_lat - current_lat) ** 2 +
            (dest_lon - current_lon) ** 2
        )

        # Assume average speed = 40 km/h
        eta_hours = distance / 40

        return {
            "trip_id": trip.id,
            "estimated_distance": round(distance, 2),
            "estimated_eta_hours": round(eta_hours, 2)
        }

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid GPS coordinates"
        )
    
@router.patch("/{trip_id}/status")
def update_trip_status(
    trip_id: int,
    trip: TripUpdate,
    db: Session = Depends(get_db)
):
    db_trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status is not None:
        db_trip.status = trip.status

    db.commit()
    db.refresh(db_trip)

    return {
        "message": "Trip status updated successfully",
        "trip": db_trip
    }
@router.get("/{trip_id}/optimize-route")
def get_optimized_route(
    trip_id: int,
    traffic: str = "Medium",
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    return optimize_route(
        trip.start_location,
        trip.end_location,
        traffic
    )