from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.services import trip_service
from app.services.geocoding_service import geocode_location
from app.services.route_service import generate_route
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


@router.get("/{trip_id}/route")
def get_trip_route(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(has_role(["Admin", "Dispatcher", "Driver"])),
):
    """
    Return driving route information for a trip.

    Workflow:
    1. Load trip (404 if not found).
    2. If any coordinate is missing, geocode pickup/destination and persist.
    3. Call OpenRouteService to get distance, duration, summary, and polyline.
    4. Return full route JSON.
    """
    # Step 1 — load trip
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Drivers may only view their own trip routes
    if current_user.role == "Driver":
        driver = db.query(Driver).filter(Driver.name.ilike(current_user.name)).first()
        if not driver or trip.driver_id != driver.id:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this resource",
            )

    # Step 2 — geocode on-the-fly if coordinates are missing
    coords_missing = any(
        v is None for v in [
            trip.pickup_latitude,
            trip.pickup_longitude,
            trip.destination_latitude,
            trip.destination_longitude,
        ]
    )
    if coords_missing:
        pickup_coords = geocode_location(trip.pickup_location)
        destination_coords = geocode_location(trip.destination)

        trip.pickup_latitude = pickup_coords["latitude"]
        trip.pickup_longitude = pickup_coords["longitude"]
        trip.destination_latitude = destination_coords["latitude"]
        trip.destination_longitude = destination_coords["longitude"]
        db.commit()
        db.refresh(trip)

    # Step 3 — generate route via OpenRouteService
    route_data = generate_route(
        pickup_latitude=trip.pickup_latitude,
        pickup_longitude=trip.pickup_longitude,
        destination_latitude=trip.destination_latitude,
        destination_longitude=trip.destination_longitude,
    )

    # Step 4 — return full route response
    return {
        "trip_id": trip.id,
        "pickup_location": trip.pickup_location,
        "destination": trip.destination,
        "pickup_coordinates": {
            "latitude": trip.pickup_latitude,
            "longitude": trip.pickup_longitude,
        },
        "destination_coordinates": {
            "latitude": trip.destination_latitude,
            "longitude": trip.destination_longitude,
        },
        "distance_km": route_data["distance_km"],
        "estimated_duration_minutes": route_data["estimated_duration_minutes"],
        "route_summary": route_data["route_summary"],
        "polyline": route_data["polyline"],
    }
