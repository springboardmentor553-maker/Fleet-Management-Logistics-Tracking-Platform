from typing import List
import math

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.driver_assignment import DriverAssignment

from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse,
    TripStatusUpdate,
    TripLocationUpdate,
)

from app.services.geocoding_service import geocode_location
from app.services.route_service import get_route
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def calculate_haversine(
    lat1,
    lon1,
    lat2,
    lon2
):
    """
    Calculate straight-line distance between two
    latitude/longitude coordinates.

    Returns:
        Distance in kilometers rounded to 2 decimals.
        None if coordinates are invalid.
    """

    try:
        lat1 = float(lat1)
        lon1 = float(lon1)

        lat2 = float(lat2)
        lon2 = float(lon2)

    except (TypeError, ValueError):
        return None

    R = 6371.0

    dlat = math.radians(lat2 - lat1)

    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        +
        math.cos(math.radians(lat1))
        *
        math.cos(math.radians(lat2))
        *
        math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return round(
        R * c,
        2
    )


# ============================================================
# GET ALL TRIPS
# ============================================================

@router.get(
    "/",
    response_model=List[TripResponse]
)
def get_trips(
    db: Session = Depends(get_db)
):

    trips = (
        db.query(Trip)
        .order_by(
            Trip.id.desc()
        )
        .all()
    )

    return trips


# ============================================================
# GET SINGLE TRIP
# ============================================================

@router.get(
    "/{trip_id}",
    response_model=TripResponse
)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )

    return trip


# ============================================================
# CREATE TRIP
# ============================================================

@router.post(
    "/",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED
)
def create_trip(
    trip_data: TripCreate,
    db: Session = Depends(get_db)
):

    # ========================================================
    # VALIDATE SHIPMENT
    # ========================================================

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == trip_data.shipment_id
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Shipment "
                f"{trip_data.shipment_id} "
                f"not found"
            )
        )

    # ========================================================
    # VALIDATE VEHICLE
    # ========================================================

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == trip_data.vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Vehicle "
                f"{trip_data.vehicle_id} "
                f"not found"
            )
        )

    # ========================================================
    # VALIDATE DRIVER
    # ========================================================

    driver = (
        db.query(Driver)
        .filter(
            Driver.id == trip_data.driver_id
        )
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Driver "
                f"{trip_data.driver_id} "
                f"not found"
            )
        )

    # ========================================================
    # GEOCODE START LOCATION
    # ========================================================

    start_coordinates = geocode_location(
        trip_data.start_location
    )

    if not start_coordinates:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unable to find coordinates "
                "for start location: "
                f"{trip_data.start_location}"
            )
        )

    # ========================================================
    # GEOCODE DESTINATION
    # ========================================================

    destination_coordinates = geocode_location(
        trip_data.end_location
    )

    if not destination_coordinates:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unable to find coordinates "
                "for destination: "
                f"{trip_data.end_location}"
            )
        )

    # ========================================================
    # CURRENT LOCATION
    # ========================================================

    current_latitude = (
        trip_data.current_latitude
        if trip_data.current_latitude is not None
        else str(
            start_coordinates["latitude"]
        )
    )

    current_longitude = (
        trip_data.current_longitude
        if trip_data.current_longitude is not None
        else str(
            start_coordinates["longitude"]
        )
    )

    # ========================================================
    # DESTINATION LOCATION
    # ========================================================

    destination_latitude = (
        trip_data.destination_latitude
        if trip_data.destination_latitude is not None
        else str(
            destination_coordinates["latitude"]
        )
    )

    destination_longitude = (
        trip_data.destination_longitude
        if trip_data.destination_longitude is not None
        else str(
            destination_coordinates["longitude"]
        )
    )

    # ========================================================
    # INITIAL DISTANCE
    # ========================================================

    initial_distance = calculate_haversine(
        current_latitude,
        current_longitude,
        destination_latitude,
        destination_longitude
    )

    # ========================================================
    # CREATE TRIP OBJECT
    # ========================================================

    trip = Trip(

        shipment_id=trip_data.shipment_id,

        vehicle_id=trip_data.vehicle_id,

        driver_id=trip_data.driver_id,

        start_location=trip_data.start_location,

        end_location=trip_data.end_location,

        departure_time=trip_data.departure_time,

        expected_arrival=trip_data.expected_arrival,

        status=trip_data.status or "Scheduled",

        current_latitude=current_latitude,

        current_longitude=current_longitude,

        destination_latitude=destination_latitude,

        destination_longitude=destination_longitude,

        actual_arrival=trip_data.actual_arrival,

        distance=(
            initial_distance
            if initial_distance is not None
            else trip_data.distance
        )
    )

    db.add(trip)

    # ========================================================
    # SAVE TRIP
    # ========================================================

    try:

        db.commit()

        db.refresh(trip)

    except Exception as e:

        db.rollback()

        print(
            "CREATE TRIP DATABASE ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create trip"
        )

    # ========================================================
    # AUDIT LOG - CREATE
    # ========================================================

    try:

        create_audit_log(
            db=db,
            module="Trips",
            action="CREATE",
            details=(
                f"Created trip #{trip.id} "
                f"from {trip.start_location} "
                f"to {trip.end_location}"
            )
        )

        db.commit()

    except Exception as e:

        db.rollback()

        print(
            "CREATE TRIP AUDIT LOG ERROR:",
            e
        )

        # Do NOT fail the trip creation just because
        # audit logging failed.
        # The trip has already been successfully created.

    return trip


# ============================================================
# UPDATE COMPLETE TRIP
# ============================================================

@router.put(
    "/{trip_id}",
    response_model=TripResponse
)
def update_trip(
    trip_id: int,
    trip_data: TripUpdate,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    update_data = trip_data.model_dump(
        exclude_unset=True
    )

    # ========================================================
    # SAVE OLD VALUES FOR AUDIT
    # ========================================================

    old_values = {}

    for field in update_data:

        if hasattr(trip, field):

            old_values[field] = getattr(
                trip,
                field
            )

    # ========================================================
    # VALIDATE SHIPMENT
    # ========================================================

    if "shipment_id" in update_data:

        if update_data["shipment_id"] is not None:

            shipment = (
                db.query(Shipment)
                .filter(
                    Shipment.id ==
                    update_data["shipment_id"]
                )
                .first()
            )

            if not shipment:
                raise HTTPException(
                    status_code=404,
                    detail="Shipment not found"
                )

    # ========================================================
    # VALIDATE VEHICLE
    # ========================================================

    if "vehicle_id" in update_data:

        if update_data["vehicle_id"] is not None:

            vehicle = (
                db.query(Vehicle)
                .filter(
                    Vehicle.id ==
                    update_data["vehicle_id"]
                )
                .first()
            )

            if not vehicle:
                raise HTTPException(
                    status_code=404,
                    detail="Vehicle not found"
                )

    # ========================================================
    # VALIDATE DRIVER
    # ========================================================

    if "driver_id" in update_data:

        if update_data["driver_id"] is not None:

            driver = (
                db.query(Driver)
                .filter(
                    Driver.id ==
                    update_data["driver_id"]
                )
                .first()
            )

            if not driver:
                raise HTTPException(
                    status_code=404,
                    detail="Driver not found"
                )

    # ========================================================
    # APPLY UPDATE
    # ========================================================

    for field, value in update_data.items():

        if (
            field == "shipment_id"
            and value is None
        ):
            continue

        if hasattr(trip, field):

            setattr(
                trip,
                field,
                value
            )

    # ========================================================
    # SAVE UPDATE
    # ========================================================

    try:

        db.commit()

        db.refresh(trip)

    except Exception as e:

        db.rollback()

        print(
            "UPDATE TRIP ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update trip"
        )

    # ========================================================
    # AUDIT LOG - UPDATE
    # ========================================================

    try:

        changed_fields = []

        for field in update_data:

            if field in old_values:

                old_value = old_values[field]

                new_value = getattr(
                    trip,
                    field,
                    None
                )

                if old_value != new_value:

                    changed_fields.append(
                        f"{field}: "
                        f"{old_value} -> "
                        f"{new_value}"
                    )

        if changed_fields:

            create_audit_log(
                db=db,
                module="Trips",
                action="UPDATE",
                details=(
                    f"Updated trip #{trip.id}. "
                    f"Changes: "
                    f"{', '.join(changed_fields)}"
                )
            )

            db.commit()

    except Exception as e:

        db.rollback()

        print(
            "UPDATE TRIP AUDIT LOG ERROR:",
            e
        )

    return trip


# ============================================================
# UPDATE STATUS
# ============================================================

@router.patch(
    "/{trip_id}/status",
    response_model=TripResponse
)
def update_trip_status(
    trip_id: int,
    status_data: TripStatusUpdate,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    # ========================================================
    # OLD STATUS
    # ========================================================

    old_status = trip.status

    # ========================================================
    # NEW STATUS
    # ========================================================

    trip.status = status_data.status

    # ========================================================
    # SAVE
    # ========================================================

    try:

        db.commit()

        db.refresh(trip)

    except Exception as e:

        db.rollback()

        print(
            "UPDATE TRIP STATUS ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update trip status"
        )

    # ========================================================
    # AUDIT LOG
    # ========================================================

    try:

        create_audit_log(
            db=db,
            module="Trips",
            action="STATUS_UPDATE",
            details=(
                f"Trip #{trip.id} status changed "
                f"from '{old_status}' "
                f"to '{trip.status}'"
            )
        )

        db.commit()

    except Exception as e:

        db.rollback()

        print(
            "UPDATE TRIP STATUS AUDIT LOG ERROR:",
            e
        )

    return trip


# ============================================================
# UPDATE GPS LOCATION
# ============================================================

@router.patch(
    "/{trip_id}/location",
    response_model=TripResponse
)
def update_trip_location(
    trip_id: int,
    location_data: TripLocationUpdate,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    # ========================================================
    # SAVE OLD LOCATION
    # ========================================================

    old_latitude = trip.current_latitude

    old_longitude = trip.current_longitude

    # ========================================================
    # UPDATE LOCATION
    # ========================================================

    trip.current_latitude = (
        location_data.current_latitude
    )

    trip.current_longitude = (
        location_data.current_longitude
    )

    # ========================================================
    # UPDATE REMAINING DISTANCE
    # ========================================================

    if (
        trip.current_latitude is not None
        and trip.current_longitude is not None
        and trip.destination_latitude is not None
        and trip.destination_longitude is not None
    ):

        distance = calculate_haversine(

            trip.current_latitude,

            trip.current_longitude,

            trip.destination_latitude,

            trip.destination_longitude

        )

        if distance is not None:

            trip.distance = distance

    # ========================================================
    # SAVE
    # ========================================================

    try:

        db.commit()

        db.refresh(trip)

    except Exception as e:

        db.rollback()

        print(
            "UPDATE LOCATION ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update trip location"
        )

    # ========================================================
    # AUDIT LOG
    # ========================================================

    try:

        create_audit_log(
            db=db,
            module="Trips",
            action="LOCATION_UPDATE",
            details=(
                f"Updated GPS location for trip #{trip.id}. "
                f"Location: "
                f"({old_latitude}, {old_longitude}) "
                f"-> "
                f"({trip.current_latitude}, "
                f"{trip.current_longitude}). "
                f"Remaining distance: "
                f"{trip.distance} km"
            )
        )

        db.commit()

    except Exception as e:

        db.rollback()

        print(
            "UPDATE LOCATION AUDIT LOG ERROR:",
            e
        )

    return trip


# ============================================================
# GET TRIP ROUTE
# ============================================================

@router.get(
    "/{trip_id}/route"
)
def get_trip_route(
    trip_id: int,
    db: Session = Depends(get_db)
):

    print("========================================")
    print("GET TRIP ROUTE")
    print("Trip ID:", trip_id)
    print("========================================")

    # ========================================================
    # FIND TRIP
    # ========================================================

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id
        )
        .first()
    )

    if not trip:

        raise HTTPException(
            status_code=404,
            detail=f"Trip {trip_id} not found"
        )

    # ========================================================
    # GET CURRENT LOCATION
    # ========================================================

    if (
        trip.current_latitude is None
        or trip.current_longitude is None
    ):

        if trip.start_location:

            print(
                "Current coordinates missing."
            )

            print(
                "Geocoding start:",
                trip.start_location
            )

            start_coordinates = geocode_location(
                trip.start_location
            )

            if start_coordinates:

                trip.current_latitude = str(
                    start_coordinates["latitude"]
                )

                trip.current_longitude = str(
                    start_coordinates["longitude"]
                )

                try:

                    db.commit()

                    db.refresh(trip)

                except Exception as e:

                    db.rollback()

                    print(
                        "START COORDINATE SAVE ERROR:",
                        e
                    )

    # ========================================================
    # GET DESTINATION LOCATION
    # ========================================================

    if (
        trip.destination_latitude is None
        or trip.destination_longitude is None
    ):

        print(
            "Destination coordinates missing."
        )

        print(
            "Geocoding destination:",
            trip.end_location
        )

        if not trip.end_location:

            raise HTTPException(
                status_code=400,
                detail="Destination location is missing."
            )

        destination_coordinates = (
            geocode_location(
                trip.end_location
            )
        )

        if not destination_coordinates:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unable to geocode destination: "
                    f"{trip.end_location}"
                )
            )

        trip.destination_latitude = str(
            destination_coordinates["latitude"]
        )

        trip.destination_longitude = str(
            destination_coordinates["longitude"]
        )

        try:

            db.commit()

            db.refresh(trip)

        except Exception as e:

            db.rollback()

            print(
                "DESTINATION COORDINATE SAVE ERROR:",
                e
            )

    # ========================================================
    # CHECK CURRENT COORDINATES
    # ========================================================

    if (
        trip.current_latitude is None
        or trip.current_longitude is None
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Current vehicle coordinates "
                "are missing and could not be determined."
            )
        )

    # ========================================================
    # CHECK DESTINATION COORDINATES
    # ========================================================

    if (
        trip.destination_latitude is None
        or trip.destination_longitude is None
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Destination coordinates "
                "are missing and could not be determined."
            )
        )

    # ========================================================
    # CONVERT COORDINATES
    # ========================================================

    try:

        current_lat = float(
            trip.current_latitude
        )

        current_lon = float(
            trip.current_longitude
        )

        destination_lat = float(
            trip.destination_latitude
        )

        destination_lon = float(
            trip.destination_longitude
        )

    except (
        TypeError,
        ValueError
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid trip coordinates"
        )

    # ========================================================
    # VALIDATE CURRENT LATITUDE
    # ========================================================

    if not -90 <= current_lat <= 90:

        raise HTTPException(
            status_code=400,
            detail="Invalid current latitude"
        )

    # ========================================================
    # VALIDATE CURRENT LONGITUDE
    # ========================================================

    if not -180 <= current_lon <= 180:

        raise HTTPException(
            status_code=400,
            detail="Invalid current longitude"
        )

    # ========================================================
    # VALIDATE DESTINATION LATITUDE
    # ========================================================

    if not -90 <= destination_lat <= 90:

        raise HTTPException(
            status_code=400,
            detail="Invalid destination latitude"
        )

    # ========================================================
    # VALIDATE DESTINATION LONGITUDE
    # ========================================================

    if not -180 <= destination_lon <= 180:

        raise HTTPException(
            status_code=400,
            detail="Invalid destination longitude"
        )

    # ========================================================
    # REQUEST REAL DRIVING ROUTE
    # ========================================================

    print(
        "Requesting route:"
    )

    print(
        "Current:",
        current_lat,
        current_lon
    )

    print(
        "Destination:",
        destination_lat,
        destination_lon
    )

    result = get_route(
        current_lat,
        current_lon,
        destination_lat,
        destination_lon
    )

    # ========================================================
    # OSRM FAILED
    # FALLBACK STRAIGHT LINE
    # ========================================================

    if not result:

        print(
            "Route service failed."
        )

        try:

            import polyline

            fallback = polyline.encode(
                [
                    (
                        current_lat,
                        current_lon
                    ),
                    (
                        destination_lat,
                        destination_lon
                    )
                ]
            )

        except Exception as e:

            print(
                "Polyline fallback error:",
                e
            )

            fallback = ""

        distance = calculate_haversine(
            current_lat,
            current_lon,
            destination_lat,
            destination_lon
        )

        return {

            "trip_id":
                trip.id,

            "pickup_location":
                trip.start_location,

            "destination":
                trip.end_location,

            "distance":
                f"{distance or 0} km",

            "estimated_travel_time":
                "Unavailable",

            "status":
                trip.status,

            "polyline":
                fallback,

            "current_coordinates": {

                "latitude":
                    current_lat,

                "longitude":
                    current_lon
            },

            "destination_coordinates": {

                "latitude":
                    destination_lat,

                "longitude":
                    destination_lon
            }
        }

    # ========================================================
    # SUCCESSFUL ROUTE
    # ========================================================

    return {

        "trip_id":
            trip.id,

        "pickup_location":
            trip.start_location,

        "destination":
            trip.end_location,

        "distance":
            f"{result['distance_km']} km",

        "estimated_travel_time":
            f"{result['duration_minutes']} minutes",

        "status":
            trip.status,

        "polyline":
            result["polyline"],

        "current_coordinates": {

            "latitude":
                current_lat,

            "longitude":
                current_lon
        },

        "destination_coordinates": {

            "latitude":
                destination_lat,

            "longitude":
                destination_lon
        }
    }


# ============================================================
# DELETE TRIP
# ============================================================

@router.delete(
    "/{trip_id}"
)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db)
):

    try:

        # ====================================================
        # FIND TRIP
        # ====================================================

        trip = (
            db.query(Trip)
            .filter(
                Trip.id == trip_id
            )
            .first()
        )

        if not trip:

            raise HTTPException(
                status_code=404,
                detail="Trip not found"
            )

        # ====================================================
        # SAVE INFORMATION BEFORE DELETE
        # ====================================================

        trip_id_value = trip.id

        start_location = trip.start_location

        end_location = trip.end_location

        # ====================================================
        # DELETE DRIVER ASSIGNMENTS FIRST
        # ====================================================

        db.query(
            DriverAssignment
        ).filter(
            DriverAssignment.trip_id == trip_id
        ).delete(
            synchronize_session=False
        )

        # ====================================================
        # DELETE TRIP
        # ====================================================

        db.delete(trip)

        db.commit()

    except HTTPException:

        db.rollback()

        raise

    except Exception as e:

        db.rollback()

        print(
            "DELETE TRIP ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to delete trip"
        )

    # ========================================================
    # AUDIT LOG
    #
    # IMPORTANT:
    # The trip has already been deleted and committed.
    # Therefore create the audit record in a NEW transaction.
    # ========================================================

    try:

        create_audit_log(
            db=db,
            module="Trips",
            action="DELETE",
            details=(
                f"Deleted trip #{trip_id_value} "
                f"from {start_location} "
                f"to {end_location}"
            )
        )

        db.commit()

    except Exception as e:

        db.rollback()

        print(
            "DELETE TRIP AUDIT LOG ERROR:",
            e
        )

    return {

        "message":
            "Trip deleted successfully",

        "trip_id":
            trip_id_value
    }