from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.routers.crud import commit_or_409
from app.schemas.routes_geo import TripRouteRead
from app.schemas.trips import TripCreate, TripRead, TripUpdate
from app.services.directions import get_route
from app.services.geocoding import geocode_location

router = APIRouter()

# Task 5 spec asks for the literal path GET /trip/{trip_id}/route (singular),
# so this is registered separately, without the /trips prefix. See main.py.
route_router = APIRouter()


def get_or_404(db: Session, model, item_id: int, label: str):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return item


def ensure_driver_available(db: Session, driver_id: int, exclude_trip_id: int | None = None):
    """Task 5: a driver can't be assigned to a new trip while they already
    have an active (Scheduled/In Progress) trip."""
    query = db.query(models.Trip).filter(
        models.Trip.driver_id == driver_id,
        models.Trip.status.in_(models.ACTIVE_TRIP_STATUSES),
    )
    if exclude_trip_id is not None:
        query = query.filter(models.Trip.id != exclude_trip_id)
    if query.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Driver already has an active trip",
        )


def ensure_vehicle_available(db: Session, vehicle_id: int, exclude_trip_id: int | None = None):
    """Task 5: same check, for vehicles."""
    query = db.query(models.Trip).filter(
        models.Trip.vehicle_id == vehicle_id,
        models.Trip.status.in_(models.ACTIVE_TRIP_STATUSES),
    )
    if exclude_trip_id is not None:
        query = query.filter(models.Trip.id != exclude_trip_id)
    if query.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle already has an active trip",
        )


@router.get("/", response_model=list[TripRead])
def list_trips(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get All Trips"""
    return db.query(models.Trip).offset(skip).limit(limit).all()


@router.post("/", response_model=TripRead, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, db: Session = Depends(get_db)):
    """Create Trip — Task 4: validates shipment/driver/vehicle exist.
    Task 5: prevents assigning a driver or vehicle already on an active trip."""
    get_or_404(db, models.Shipment, payload.shipment_id, "Shipment")
    get_or_404(db, models.Driver, payload.driver_id, "Driver")
    get_or_404(db, models.Vehicle, payload.vehicle_id, "Vehicle")

    if payload.status in models.ACTIVE_TRIP_STATUSES:
        ensure_driver_available(db, payload.driver_id)
        ensure_vehicle_available(db, payload.vehicle_id)

    trip = models.Trip(**payload.model_dump())
    db.add(trip)
    commit_or_409(db)
    db.refresh(trip)
    return trip


@router.get("/{item_id}", response_model=TripRead)
def get_trip(item_id: int, db: Session = Depends(get_db)):
    """Get Trip by ID"""
    return get_or_404(db, models.Trip, item_id, "Trip")


@router.put("/{item_id}", response_model=TripRead)
def update_trip(item_id: int, payload: TripUpdate, db: Session = Depends(get_db)):
    """Update Trip — re-validates FKs and the double-assignment rule for
    whatever is changing."""
    trip = get_or_404(db, models.Trip, item_id, "Trip")
    data = payload.model_dump(exclude_unset=True)

    if "shipment_id" in data:
        get_or_404(db, models.Shipment, data["shipment_id"], "Shipment")
    if "driver_id" in data:
        get_or_404(db, models.Driver, data["driver_id"], "Driver")
    if "vehicle_id" in data:
        get_or_404(db, models.Vehicle, data["vehicle_id"], "Vehicle")

    next_status = data.get("status", trip.status)
    next_driver_id = data.get("driver_id", trip.driver_id)
    next_vehicle_id = data.get("vehicle_id", trip.vehicle_id)

    if next_status in models.ACTIVE_TRIP_STATUSES:
        ensure_driver_available(db, next_driver_id, exclude_trip_id=trip.id)
        ensure_vehicle_available(db, next_vehicle_id, exclude_trip_id=trip.id)

    for field, value in data.items():
        setattr(trip, field, value)

    commit_or_409(db)
    db.refresh(trip)
    return trip


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(item_id: int, db: Session = Depends(get_db)):
    """Delete Trip"""
    trip = get_or_404(db, models.Trip, item_id, "Trip")
    db.delete(trip)
    commit_or_409(db)
    return None


def _resolve_coordinates(trip: models.Trip, db: Session) -> None:
    """If a trip is missing coordinates, geocode its pickup/destination
    location names and store the result on the trip."""
    changed = False
    if trip.pickup_latitude is None or trip.pickup_longitude is None:
        result = geocode_location(trip.pickup_location)
        trip.pickup_latitude = result.latitude
        trip.pickup_longitude = result.longitude
        changed = True
    if trip.destination_latitude is None or trip.destination_longitude is None:
        result = geocode_location(trip.destination)
        trip.destination_latitude = result.latitude
        trip.destination_longitude = result.longitude
        changed = True
    if changed:
        commit_or_409(db)
        db.refresh(trip)


@route_router.get("/trip/{trip_id}/route", response_model=TripRouteRead)
def get_trip_route(trip_id: int, db: Session = Depends(get_db)):
    """Task 5: returns pickup location, destination, distance, estimated
    travel time, and route summary for a trip, using the Google Directions
    API. Geocodes pickup/destination on the fly if coordinates aren't
    already stored on the trip."""
    trip = get_or_404(db, models.Trip, trip_id, "Trip")

    _resolve_coordinates(trip, db)

    route = get_route(
        pickup_lat=trip.pickup_latitude,
        pickup_lng=trip.pickup_longitude,
        destination_lat=trip.destination_latitude,
        destination_lng=trip.destination_longitude,
    )

    return TripRouteRead(
        trip_id=trip.id,
        pickup_location=trip.pickup_location,
        destination=trip.destination,
        distance_text=route.distance_text,
        distance_meters=route.distance_meters,
        estimated_travel_time=route.duration_text,
        duration_seconds=route.duration_seconds,
        route_summary=route.summary,
        polyline=route.polyline,
    )
