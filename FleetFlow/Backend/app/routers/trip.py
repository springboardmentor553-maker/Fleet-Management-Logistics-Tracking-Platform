from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripStatusUpdate, TripResponse
from app.services.trip import get_all_trips, get_trip, create_trip, update_trip_status, delete_trip
from app.services.maps import geocode_location, get_route_between_locations
from app.connection_manager import manager

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
async def change_status(trip_id: int, data: TripStatusUpdate, db: Session = Depends(get_db), _: User = Depends(_trip_roles)):
    trip = update_trip_status(trip_id, data.status, db)
    await manager.broadcast_status_update(trip_id, trip.status)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_trip(trip_id: int, db: Session = Depends(get_db), _: User = Depends(_trip_roles)):
    delete_trip(trip_id, db)


@router.get("/{trip_id}/route")
def get_trip_route(trip_id: int, db: Session = Depends(get_db), _: User = Depends(_trip_roles)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if trip.pickup_latitude is None or trip.pickup_longitude is None:
        pickup = geocode_location(trip.shipment_origin or "")
        trip.pickup_latitude = pickup["latitude"]
        trip.pickup_longitude = pickup["longitude"]

    if trip.destination_latitude is None or trip.destination_longitude is None:
        destination = geocode_location(trip.shipment_destination or "")
        trip.destination_latitude = destination["latitude"]
        trip.destination_longitude = destination["longitude"]

    db.commit()

    route = get_route_between_locations(
        (trip.pickup_latitude, trip.pickup_longitude),
        (trip.destination_latitude, trip.destination_longitude),
    )

    return {
        "trip_id": trip.id,
        "pickup_location": trip.shipment_origin,
        "destination": trip.shipment_destination,
        "distance": route.get("distance_text"),
        "estimated_travel_time": route.get("duration_text"),
        "route_summary": route.get("summary"),
        "route_polyline": route.get("polyline"),
        "source": route.get("source"),
    }
