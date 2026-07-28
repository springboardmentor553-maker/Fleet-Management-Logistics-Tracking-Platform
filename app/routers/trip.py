from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.trip import Trip, TripStatus
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.models.route import Route

from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse,
    TripStatusUpdate
)

router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)


# -------------------------
# Generate Trip Number
# -------------------------

def generate_trip_number(db: Session):
    last_trip = (
        db.query(Trip)
        .order_by(Trip.id.desc())
        .first()
    )

    if last_trip:
        number = last_trip.id + 1
    else:
        number = 1

    return f"TRP{100000 + number}"


# -------------------------
# Create Trip
# -------------------------

@router.post("/", response_model=TripResponse)
def create_trip(
    trip: TripCreate,
    db: Session = Depends(get_db)
):

    shipment = db.query(Shipment).filter(
        Shipment.id == trip.shipment_id
    ).first()

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    driver = db.query(Driver).filter(
        Driver.id == trip.driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == trip.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    route = db.query(Route).filter(
        Route.id == trip.route_id
    ).first()

    if route is None:
        raise HTTPException(
            status_code=404,
            detail="Route not found"
        )
    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == trip.driver_id,
            Trip.status.in_([
                TripStatus.CREATED,
                TripStatus.ASSIGNED,
                TripStatus.STARTED,
                TripStatus.IN_PROGRESS
            ])
        )
        .first()
    )

    if active_driver_trip:
        raise HTTPException(
            status_code=400,
            detail="Driver already has an active trip"
        )

    # -------------------------
    # Check Vehicle Active Trip
    # -------------------------
    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == trip.vehicle_id,
            Trip.status.in_([
                TripStatus.CREATED,
                TripStatus.ASSIGNED,
                TripStatus.STARTED,
                TripStatus.IN_PROGRESS
            ])
        )
        .first()
    )

    if active_vehicle_trip:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already has an active trip"
        )


    new_trip = Trip(
        trip_number=generate_trip_number(db),
        shipment_id=trip.shipment_id,
        driver_id=trip.driver_id,
        vehicle_id=trip.vehicle_id,
        pickup_location=trip.pickup_location,
        destination=trip.destination,
        route_id=trip.route_id,
        start_date=trip.start_date,
        expected_end_date=trip.expected_end_date,
        notes=trip.notes,
        status=TripStatus.CREATED
    )

    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    return new_trip


# -------------------------
# Get All Trips
# -------------------------

@router.get("/", response_model=list[TripResponse])
def get_trips(
    db: Session = Depends(get_db)
):
    return db.query(Trip).all()


# -------------------------
# Get Trip By ID
# -------------------------

@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db)
):

    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    return trip


# -------------------------
# Update Trip
# -------------------------

@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    trip: TripUpdate,
    db: Session = Depends(get_db)
):

    db_trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if db_trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    shipment = db.query(Shipment).filter(
        Shipment.id == trip.shipment_id
    ).first()

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    driver = db.query(Driver).filter(
        Driver.id == trip.driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == trip.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    route = db.query(Route).filter(
        Route.id == trip.route_id
    ).first()

    if route is None:
        raise HTTPException(
            status_code=404,
            detail="Route not found"
        )

    db_trip.shipment_id = trip.shipment_id
    db_trip.driver_id = trip.driver_id
    db_trip.vehicle_id = trip.vehicle_id
    db_trip.pickup_location = trip.pickup_location
    db_trip.destination = trip.destination
    db_trip.route_id = trip.route_id
    db_trip.start_date = trip.start_date
    db_trip.expected_end_date = trip.expected_end_date
    db_trip.actual_end_date = trip.actual_end_date
    db_trip.status = trip.status
    db_trip.notes = trip.notes

    db.commit()
    db.refresh(db_trip)

    return db_trip


# -------------------------
# Delete Trip
# -------------------------

@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db)
):

    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    db.delete(trip)
    db.commit()

    return {
        "message": "Trip deleted successfully"
    }


# -------------------------
# Update Trip Status
# -------------------------

@router.patch("/{trip_id}/status")
def update_trip_status(
    trip_id: int,
    status: TripStatusUpdate,
    db: Session = Depends(get_db)
):

    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    trip.status = status.status

    db.commit()
    db.refresh(trip)

    return {
        "message": "Trip status updated successfully",
        "trip_status": trip.status
    }