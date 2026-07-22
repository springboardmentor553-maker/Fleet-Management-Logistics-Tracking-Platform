from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role
from app.services.geocoding import geocode_location
from app.services.routing import get_route
from app.services.eta_service import calculate_eta
from app.routers.shipments import broadcast_shipment_update

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


async def sync_shipment_assignment(db: Session, shipment_id: int, vehicle_id: int, driver_id: int):
    """
    Keeps a linked shipment's vehicle/driver in sync with the trip carrying it,
    so the Shipments page and the Trips page never show conflicting assignments.
    """
    if not shipment_id:
        return
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        return
    if shipment.vehicle_id != vehicle_id or shipment.driver_id != driver_id:
        shipment.vehicle_id = vehicle_id
        shipment.driver_id = driver_id
        db.commit()
        db.refresh(shipment)
        await broadcast_shipment_update(shipment)


@router.post("/", response_model=schemas.TripResponse)
async def create_trip(trip: schemas.TripCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
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

    # Keep the linked shipment's vehicle/driver in sync with this trip
    await sync_shipment_assignment(db, new_trip.shipment_id, new_trip.vehicle_id, new_trip.driver_id)

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
async def update_trip(trip_id: int, updated: schemas.TripCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
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

    previous_shipment_id = trip.shipment_id

    for key, value in updated.dict().items():
        setattr(trip, key, value)

    db.commit()
    db.refresh(trip)

    # Sync the newly-linked shipment (if any) to this trip's vehicle/driver
    await sync_shipment_assignment(db, trip.shipment_id, trip.vehicle_id, trip.driver_id)

    # If the trip was unlinked from a shipment or switched to a different one,
    # the old shipment no longer has a trip — leave its vehicle/driver as-is
    # (it still reflects the last known assignment) rather than clearing it.

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

@router.get("/{trip_id}/route", response_model=schemas.TripRouteResponse)
def get_trip_route(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if trip.pickup_lat is None or trip.pickup_lng is None:
        pickup_coords = geocode_location(trip.origin)
        if not pickup_coords:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not geocode pickup location: {trip.origin}")
        trip.pickup_lat = pickup_coords["lat"]
        trip.pickup_lng = pickup_coords["lng"]

    if trip.destination_lat is None or trip.destination_lng is None:
        dest_coords = geocode_location(trip.destination)
        if not dest_coords:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not geocode destination: {trip.destination}")
        trip.destination_lat = dest_coords["lat"]
        trip.destination_lng = dest_coords["lng"]

    db.commit()
    db.refresh(trip)

    route = get_route(trip.pickup_lat, trip.pickup_lng, trip.destination_lat, trip.destination_lng)
    if not route:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not calculate route between these locations")

    return {
        "pickup_location": trip.origin,
        "destination": trip.destination,
        "distance_km": route["distance_km"],
        "duration_min": route["duration_min"],
        "route_summary": route["route_summary"],
    }

@router.get("/{trip_id}/eta", response_model=schemas.TripETAResponse)
def get_trip_eta(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if trip.pickup_lat is None or trip.pickup_lng is None:
        pickup_coords = geocode_location(trip.origin)
        if not pickup_coords:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not geocode pickup location: {trip.origin}")
        trip.pickup_lat = pickup_coords["lat"]
        trip.pickup_lng = pickup_coords["lng"]

    if trip.destination_lat is None or trip.destination_lng is None:
        dest_coords = geocode_location(trip.destination)
        if not dest_coords:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not geocode destination: {trip.destination}")
        trip.destination_lat = dest_coords["lat"]
        trip.destination_lng = dest_coords["lng"]

    db.commit()
    db.refresh(trip)

    route = get_route(trip.pickup_lat, trip.pickup_lng, trip.destination_lat, trip.destination_lng)
    if not route:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not calculate route between these locations")

    eta = calculate_eta(route["duration_min"], start_time=trip.scheduled_start)

    return {
        "trip_id": trip.id,
        "distance_km": route["distance_km"],
        "duration_min": route["duration_min"],
        "estimated_arrival": eta["eta_readable"],
    }