from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle

from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse,
)

from app.services.geocoding_service import get_coordinates
from app.services.route_service import get_route
from app.services.eta_sevice import calculate_eta


# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/trips",
    tags=["Trips"],
)


# ==========================================================
# ACTIVE TRIP STATUSES
# ==========================================================

ACTIVE_TRIP_STATUSES = [
    "Scheduled",
    "In Progress",
    "In Transit",
]


# ==========================================================
# RESOLVE COORDINATES
# ==========================================================

def resolve_coordinates(
    pickup_location: str,
    destination: str,
    pickup_latitude=None,
    pickup_longitude=None,
    destination_latitude=None,
    destination_longitude=None,
):
    """
    Resolve pickup and destination coordinates.

    Existing coordinates are reused.

    Missing coordinates are obtained from
    the configured OpenStreetMap/Nominatim
    geocoding service.
    """

    # ------------------------------------------------------
    # Validate pickup
    # ------------------------------------------------------

    if not pickup_location or not pickup_location.strip():
        raise ValueError(
            "Pickup location is required."
        )

    # ------------------------------------------------------
    # Validate destination
    # ------------------------------------------------------

    if not destination or not destination.strip():
        raise ValueError(
            "Destination is required."
        )

    pickup_location = pickup_location.strip()
    destination = destination.strip()

    # ------------------------------------------------------
    # Pickup coordinates
    # ------------------------------------------------------

    if (
        pickup_latitude is None
        or pickup_longitude is None
    ):
        pickup = get_coordinates(
            pickup_location
        )

        pickup_latitude = pickup["latitude"]
        pickup_longitude = pickup["longitude"]

    # ------------------------------------------------------
    # Destination coordinates
    # ------------------------------------------------------

    if (
        destination_latitude is None
        or destination_longitude is None
    ):
        destination_coordinates = get_coordinates(
            destination
        )

        destination_latitude = (
            destination_coordinates["latitude"]
        )

        destination_longitude = (
            destination_coordinates["longitude"]
        )

    # ------------------------------------------------------
    # Return
    # ------------------------------------------------------

    return {
        "pickup_latitude": float(
            pickup_latitude
        ),
        "pickup_longitude": float(
            pickup_longitude
        ),
        "destination_latitude": float(
            destination_latitude
        ),
        "destination_longitude": float(
            destination_longitude
        ),
    }


# ==========================================================
# CREATE TRIP
# ==========================================================

@router.post(
    "/",
    response_model=TripResponse,
    status_code=201,
)
def create_trip(
    trip: TripCreate,
    db: Session = Depends(get_db),
):

    # ------------------------------------------------------
    # Validate shipment
    # ------------------------------------------------------

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == trip.shipment_id
        )
        .first()
    )

    if shipment is None:
        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    # ------------------------------------------------------
    # Validate driver
    # ------------------------------------------------------

    driver = (
        db.query(Driver)
        .filter(
            Driver.id == trip.driver_id
        )
        .first()
    )

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    # ------------------------------------------------------
    # Validate vehicle
    # ------------------------------------------------------

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == trip.vehicle_id
        )
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    # ------------------------------------------------------
    # Prevent duplicate active driver
    # ------------------------------------------------------

    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == trip.driver_id,
            Trip.trip_status.in_(
                ACTIVE_TRIP_STATUSES
            ),
        )
        .first()
    )

    if active_driver_trip:
        raise HTTPException(
            status_code=400,
            detail=(
                "Driver is already assigned "
                "to an active trip."
            ),
        )

    # ------------------------------------------------------
    # Prevent duplicate active vehicle
    # ------------------------------------------------------

    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == trip.vehicle_id,
            Trip.trip_status.in_(
                ACTIVE_TRIP_STATUSES
            ),
        )
        .first()
    )

    if active_vehicle_trip:
        raise HTTPException(
            status_code=400,
            detail=(
                "Vehicle is already assigned "
                "to an active trip."
            ),
        )

    # ------------------------------------------------------
    # Resolve coordinates
    # ------------------------------------------------------

    try:

        coordinates = resolve_coordinates(
            pickup_location=trip.pickup_location,
            destination=trip.destination,
            pickup_latitude=trip.pickup_latitude,
            pickup_longitude=trip.pickup_longitude,
            destination_latitude=(
                trip.destination_latitude
            ),
            destination_longitude=(
                trip.destination_longitude
            ),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    # ------------------------------------------------------
    # Create trip
    #
    # IMPORTANT:
    # Current location starts as NULL.
    #
    # The simulator will set it to pickup when
    # the trip actually starts.
    # ------------------------------------------------------

    new_trip = Trip(
        shipment_id=trip.shipment_id,
        driver_id=trip.driver_id,
        vehicle_id=trip.vehicle_id,

        pickup_location=trip.pickup_location,
        destination=trip.destination,

        pickup_latitude=(
            coordinates["pickup_latitude"]
        ),

        pickup_longitude=(
            coordinates["pickup_longitude"]
        ),

        destination_latitude=(
            coordinates["destination_latitude"]
        ),

        destination_longitude=(
            coordinates["destination_longitude"]
        ),

        scheduled_start_time=(
            trip.scheduled_start_time
        ),

        scheduled_end_time=(
            trip.scheduled_end_time
        ),

        trip_status=trip.trip_status,

        # --------------------------------------------------
        # Persistent live state
        # --------------------------------------------------

        current_latitude=None,
        current_longitude=None,

        progress=0.0,

        remaining_distance_km=None,

        remaining_duration_minutes=None,
    )

    # ------------------------------------------------------
    # Save
    # ------------------------------------------------------

    try:

        db.add(new_trip)

        db.commit()

        db.refresh(new_trip)

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to create trip: "
                f"{str(exc)}"
            ),
        )

    return new_trip


# ==========================================================
# GET ALL TRIPS
# ==========================================================

@router.get(
    "/",
    response_model=list[TripResponse],
)
def get_all_trips(
    db: Session = Depends(get_db),
):

    trips = (
        db.query(Trip)
        .order_by(
            Trip.id.asc()
        )
        .all()
    )

    changed = False

    # ------------------------------------------------------
    # Repair missing coordinates
    # ------------------------------------------------------

    for trip in trips:

        if (
            trip.pickup_latitude is None
            or trip.pickup_longitude is None
            or trip.destination_latitude is None
            or trip.destination_longitude is None
        ):

            try:

                coordinates = resolve_coordinates(
                    pickup_location=(
                        trip.pickup_location
                    ),
                    destination=(
                        trip.destination
                    ),
                    pickup_latitude=(
                        trip.pickup_latitude
                    ),
                    pickup_longitude=(
                        trip.pickup_longitude
                    ),
                    destination_latitude=(
                        trip.destination_latitude
                    ),
                    destination_longitude=(
                        trip.destination_longitude
                    ),
                )

                trip.pickup_latitude = (
                    coordinates[
                        "pickup_latitude"
                    ]
                )

                trip.pickup_longitude = (
                    coordinates[
                        "pickup_longitude"
                    ]
                )

                trip.destination_latitude = (
                    coordinates[
                        "destination_latitude"
                    ]
                )

                trip.destination_longitude = (
                    coordinates[
                        "destination_longitude"
                    ]
                )

                changed = True

            except ValueError:
                continue

    # ------------------------------------------------------
    # Save repaired coordinates
    # ------------------------------------------------------

    if changed:

        try:

            db.commit()

        except Exception:

            db.rollback()

    return trips


# ==========================================================
# GET SINGLE TRIP
# ==========================================================

@router.get(
    "/{trip_id}",
    response_model=TripResponse,
)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if trip is None:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    # ------------------------------------------------------
    # Repair coordinates if required
    # ------------------------------------------------------

    if (
        trip.pickup_latitude is None
        or trip.pickup_longitude is None
        or trip.destination_latitude is None
        or trip.destination_longitude is None
    ):

        try:

            coordinates = resolve_coordinates(
                pickup_location=(
                    trip.pickup_location
                ),
                destination=(
                    trip.destination
                ),
                pickup_latitude=(
                    trip.pickup_latitude
                ),
                pickup_longitude=(
                    trip.pickup_longitude
                ),
                destination_latitude=(
                    trip.destination_latitude
                ),
                destination_longitude=(
                    trip.destination_longitude
                ),
            )

            trip.pickup_latitude = (
                coordinates[
                    "pickup_latitude"
                ]
            )

            trip.pickup_longitude = (
                coordinates[
                    "pickup_longitude"
                ]
            )

            trip.destination_latitude = (
                coordinates[
                    "destination_latitude"
                ]
            )

            trip.destination_longitude = (
                coordinates[
                    "destination_longitude"
                ]
            )

            db.commit()

            db.refresh(trip)

        except ValueError as exc:

            raise HTTPException(
                status_code=400,
                detail=str(exc),
            )

    return trip


# ==========================================================
# GET NORMAL TRIP ETA
# ==========================================================

@router.get(
    "/{trip_id}/eta"
)
def get_trip_eta(
    trip_id: int,
    db: Session = Depends(get_db),
):
    """
    Normal route ETA.

    For a trip that has not started:
        Pickup -> Destination

    For a trip already in progress:
        Current vehicle location -> Destination
    """

    # ------------------------------------------------------
    # Find trip
    # ------------------------------------------------------

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if trip is None:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    # ------------------------------------------------------
    # Validate destination
    # ------------------------------------------------------

    if (
        trip.destination_latitude is None
        or trip.destination_longitude is None
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Trip destination coordinates "
                "are missing."
            ),
        )

    # ------------------------------------------------------
    # Decide starting point
    #
    # If vehicle has already moved, use its
    # persisted location.
    #
    # Otherwise use pickup.
    # ------------------------------------------------------

    if (
        trip.current_latitude is not None
        and trip.current_longitude is not None
        and trip.trip_status in [
            "In Progress",
            "In Transit",
        ]
    ):

        start_latitude = float(
            trip.current_latitude
        )

        start_longitude = float(
            trip.current_longitude
        )

        eta_source = "current_vehicle_location"

    else:

        if (
            trip.pickup_latitude is None
            or trip.pickup_longitude is None
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Trip pickup coordinates "
                    "are missing."
                ),
            )

        start_latitude = float(
            trip.pickup_latitude
        )

        start_longitude = float(
            trip.pickup_longitude
        )

        eta_source = "pickup_location"

    # ------------------------------------------------------
    # Calculate road route
    # ------------------------------------------------------

    try:

        route = get_route(
            start_latitude,
            start_longitude,
            float(
                trip.destination_latitude
            ),
            float(
                trip.destination_longitude
            ),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    # ------------------------------------------------------
    # Calculate ETA
    # ------------------------------------------------------

    try:

        eta = calculate_eta(
            route["distance_km"],
            route["duration_minutes"],
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to calculate ETA: "
                f"{str(exc)}"
            ),
        )

    # ------------------------------------------------------
    # Return
    # ------------------------------------------------------

    return {
        "trip_id": trip.id,

        "shipment_id": trip.shipment_id,

        "pickup_location": (
            trip.pickup_location
        ),

        "destination": (
            trip.destination
        ),

        "pickup_latitude": (
            trip.pickup_latitude
        ),

        "pickup_longitude": (
            trip.pickup_longitude
        ),

        "destination_latitude": (
            trip.destination_latitude
        ),

        "destination_longitude": (
            trip.destination_longitude
        ),

        "current_latitude": (
            trip.current_latitude
        ),

        "current_longitude": (
            trip.current_longitude
        ),

        "distance_km": (
            eta["distance_km"]
        ),

        "duration_minutes": (
            eta["duration_minutes"]
        ),

        "remaining_distance_km": (
            eta["distance_km"]
        ),

        "remaining_duration_minutes": (
            eta["duration_minutes"]
        ),

        "estimated_arrival_time": (
            eta["estimated_arrival_time"]
        ),

        "trip_status": (
            trip.trip_status
        ),

        "eta_source": eta_source,
    }


# ==========================================================
# GET LIVE ETA FROM SAVED VEHICLE LOCATION
# ==========================================================

@router.get(
    "/{trip_id}/live-eta"
)
def get_live_eta(
    trip_id: int,
    db: Session = Depends(get_db),
):

    """
    Calculate remaining road ETA from the
    vehicle's persisted current location.

    IMPORTANT:
    The frontend does NOT need to send latitude
    and longitude.

    The backend reads them directly from Trip.
    """

    # ------------------------------------------------------
    # Find trip
    # ------------------------------------------------------

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if trip is None:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    # ------------------------------------------------------
    # Check vehicle location
    # ------------------------------------------------------

    if (
        trip.current_latitude is None
        or trip.current_longitude is None
    ):

        # Trip hasn't started yet.
        # Use pickup as the current position.

        if (
            trip.pickup_latitude is None
            or trip.pickup_longitude is None
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Current vehicle location "
                    "is not available."
                ),
            )

        current_latitude = float(
            trip.pickup_latitude
        )

        current_longitude = float(
            trip.pickup_longitude
        )

        location_source = "pickup"

    else:

        current_latitude = float(
            trip.current_latitude
        )

        current_longitude = float(
            trip.current_longitude
        )

        location_source = "vehicle"

    # ------------------------------------------------------
    # Validate destination
    # ------------------------------------------------------

    if (
        trip.destination_latitude is None
        or trip.destination_longitude is None
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Trip destination coordinates "
                "are missing."
            ),
        )

    # ------------------------------------------------------
    # Current location -> destination
    # ------------------------------------------------------

    try:

        route = get_route(
            current_latitude,
            current_longitude,
            float(
                trip.destination_latitude
            ),
            float(
                trip.destination_longitude
            ),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    # ------------------------------------------------------
    # Calculate ETA
    # ------------------------------------------------------

    try:

        eta = calculate_eta(
            route["distance_km"],
            route["duration_minutes"],
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to calculate live ETA: "
                f"{str(exc)}"
            ),
        )

    # ------------------------------------------------------
    # Update persistent ETA
    # ------------------------------------------------------

    trip.remaining_distance_km = (
        float(
            eta["distance_km"]
        )
    )

    trip.remaining_duration_minutes = (
        float(
            eta["duration_minutes"]
        )
    )

    try:

        db.commit()

    except Exception:

        db.rollback()

    # ------------------------------------------------------
    # Return
    # ------------------------------------------------------

    return {
        "trip_id": trip.id,

        "latitude": round(
            current_latitude,
            6,
        ),

        "longitude": round(
            current_longitude,
            6,
        ),

        "destination_latitude": (
            trip.destination_latitude
        ),

        "destination_longitude": (
            trip.destination_longitude
        ),

        "remaining_distance_km": round(
            float(
                eta["distance_km"]
            ),
            2,
        ),

        "remaining_duration_minutes": round(
            float(
                eta["duration_minutes"]
            ),
            2,
        ),

        "estimated_arrival_time": (
            eta["estimated_arrival_time"]
        ),

        "status": trip.trip_status,

        "location_source": (
            location_source
        ),
    }


# ==========================================================
# UPDATE TRIP
# ==========================================================

@router.put(
    "/{trip_id}",
    response_model=TripResponse,
)
def update_trip(
    trip_id: int,
    trip: TripUpdate,
    db: Session = Depends(get_db),
):

    # ------------------------------------------------------
    # Find existing trip
    # ------------------------------------------------------

    db_trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if db_trip is None:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    # ------------------------------------------------------
    # Validate shipment
    # ------------------------------------------------------

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == trip.shipment_id
        )
        .first()
    )

    if shipment is None:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found",
        )

    # ------------------------------------------------------
    # Validate driver
    # ------------------------------------------------------

    driver = (
        db.query(Driver)
        .filter(
            Driver.id == trip.driver_id
        )
        .first()
    )

    if driver is None:

        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    # ------------------------------------------------------
    # Validate vehicle
    # ------------------------------------------------------

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == trip.vehicle_id
        )
        .first()
    )

    if vehicle is None:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    # ------------------------------------------------------
    # Driver duplicate check
    # ------------------------------------------------------

    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == trip.driver_id,

            Trip.trip_status.in_(
                ACTIVE_TRIP_STATUSES
            ),

            Trip.id != trip_id,
        )
        .first()
    )

    if active_driver_trip:

        raise HTTPException(
            status_code=400,
            detail=(
                "Driver is already assigned "
                "to another active trip."
            ),
        )

    # ------------------------------------------------------
    # Vehicle duplicate check
    # ------------------------------------------------------

    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == trip.vehicle_id,

            Trip.trip_status.in_(
                ACTIVE_TRIP_STATUSES
            ),

            Trip.id != trip_id,
        )
        .first()
    )

    if active_vehicle_trip:

        raise HTTPException(
            status_code=400,
            detail=(
                "Vehicle is already assigned "
                "to another active trip."
            ),
        )

    # ------------------------------------------------------
    # Remember old route
    # ------------------------------------------------------

    old_pickup_location = (
        db_trip.pickup_location
    )

    old_destination = (
        db_trip.destination
    )

    # ------------------------------------------------------
    # Resolve coordinates
    # ------------------------------------------------------

    try:

        coordinates = resolve_coordinates(
            pickup_location=(
                trip.pickup_location
            ),

            destination=(
                trip.destination
            ),

            pickup_latitude=(
                trip.pickup_latitude
            ),

            pickup_longitude=(
                trip.pickup_longitude
            ),

            destination_latitude=(
                trip.destination_latitude
            ),

            destination_longitude=(
                trip.destination_longitude
            ),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    # ------------------------------------------------------
    # Detect route change
    # ------------------------------------------------------

    route_changed = (
        old_pickup_location
        != trip.pickup_location
        or
        old_destination
        != trip.destination
    )

    # ------------------------------------------------------
    # Update basic fields
    # ------------------------------------------------------

    db_trip.shipment_id = (
        trip.shipment_id
    )

    db_trip.driver_id = (
        trip.driver_id
    )

    db_trip.vehicle_id = (
        trip.vehicle_id
    )

    db_trip.pickup_location = (
        trip.pickup_location
    )

    db_trip.destination = (
        trip.destination
    )

    # ------------------------------------------------------
    # Update coordinates
    # ------------------------------------------------------

    db_trip.pickup_latitude = (
        coordinates[
            "pickup_latitude"
        ]
    )

    db_trip.pickup_longitude = (
        coordinates[
            "pickup_longitude"
        ]
    )

    db_trip.destination_latitude = (
        coordinates[
            "destination_latitude"
        ]
    )

    db_trip.destination_longitude = (
        coordinates[
            "destination_longitude"
        ]
    )

    # ------------------------------------------------------
    # Update schedule
    # ------------------------------------------------------

    db_trip.scheduled_start_time = (
        trip.scheduled_start_time
    )

    db_trip.scheduled_end_time = (
        trip.scheduled_end_time
    )

    db_trip.trip_status = (
        trip.trip_status
    )

    # ------------------------------------------------------
    # IMPORTANT
    #
    # If only status/schedule changes:
    # KEEP the current vehicle location.
    #
    # If pickup/destination changes:
    # reset live position because it is now
    # a completely different route.
    # ------------------------------------------------------

    if route_changed:

        db_trip.current_latitude = None

        db_trip.current_longitude = None

        db_trip.progress = 0.0

        db_trip.remaining_distance_km = None

        db_trip.remaining_duration_minutes = None

    # ------------------------------------------------------
    # Save
    # ------------------------------------------------------

    try:

        db.commit()

        db.refresh(db_trip)

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to update trip: "
                f"{str(exc)}"
            ),
        )

    return db_trip


# ==========================================================
# DELETE TRIP
# ==========================================================

@router.delete(
    "/{trip_id}"
)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if trip is None:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    try:

        db.delete(trip)

        db.commit()

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to delete trip: "
                f"{str(exc)}"
            ),
        )

    return {
        "message":
            "Trip deleted successfully"
    }