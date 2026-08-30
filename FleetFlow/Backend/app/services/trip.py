from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.driver_assignment import DriverAssignment
from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle

from app.schemas.trip import TripCreate
from app.services.maps import geocode_location
from app.services.notification_service import notify_event, notify_driver_event


# ============================================================
# GET ALL TRIPS
# ============================================================

def get_all_trips(db: Session):
    return (
        db.query(Trip)
        .order_by(Trip.id)
        .all()
    )


# ============================================================
# GET TRIP
# ============================================================

def get_trip(trip_id: int, db: Session):

    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )

    # --------------------------------------------------------
    # Geocode pickup if coordinates are missing
    # --------------------------------------------------------

    if (
        trip.pickup_latitude is None
        or trip.pickup_longitude is None
    ):

        pickup_coords = geocode_location(
            trip.shipment.origin
            if trip.shipment
            else ""
        )

        trip.pickup_latitude = pickup_coords["latitude"]
        trip.pickup_longitude = pickup_coords["longitude"]

    # --------------------------------------------------------
    # Geocode destination if coordinates are missing
    # --------------------------------------------------------

    if (
        trip.destination_latitude is None
        or trip.destination_longitude is None
    ):

        destination_coords = geocode_location(
            trip.shipment.destination
            if trip.shipment
            else ""
        )

        trip.destination_latitude = destination_coords["latitude"]
        trip.destination_longitude = destination_coords["longitude"]

    db.commit()

    return trip


# ============================================================
# CREATE TRIP
# ============================================================

def create_trip(data: TripCreate, db: Session):

    # --------------------------------------------------------
    # Find shipment
    # --------------------------------------------------------

    shipment = (
        db.query(Shipment)
        .filter(
            Shipment.id == data.shipment_id
        )
        .first()
    )

    if not shipment:
        raise HTTPException(
            status_code=400,
            detail="Shipment not found"
        )

    if shipment.status != "in_transit":
        raise HTTPException(
            status_code=400,
            detail="Shipment must be in_transit to create a trip"
        )

    # --------------------------------------------------------
    # Find driver
    # --------------------------------------------------------

    driver = (
        db.query(Driver)
        .filter(
            Driver.id == data.driver_id
        )
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=400,
            detail="Driver not found"
        )

    # --------------------------------------------------------
    # Driver validation
    # --------------------------------------------------------

    if driver.attendance_status == "on_leave":
        raise HTTPException(
            status_code=400,
            detail="Driver is on leave"
        )

    if not driver.is_available:
        raise HTTPException(
            status_code=400,
            detail="Driver is unavailable"
        )

    # --------------------------------------------------------
    # Check driver active trip
    # --------------------------------------------------------

    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == driver.id,
            Trip.status.in_(
                [
                    "scheduled",
                    "started",
                ]
            )
        )
        .first()
    )

    if active_driver_trip:
        raise HTTPException(
            status_code=400,
            detail="Driver already has an active trip"
        )

    # --------------------------------------------------------
    # Find vehicle
    # --------------------------------------------------------

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == data.vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=400,
            detail="Vehicle not found"
        )

    # --------------------------------------------------------
    # Vehicle availability
    # --------------------------------------------------------

    if vehicle.current_status != "available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is unavailable"
        )

    # --------------------------------------------------------
    # Check vehicle active trip
    # --------------------------------------------------------

    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == vehicle.id,
            Trip.status.in_(
                [
                    "scheduled",
                    "started",
                ]
            )
        )
        .first()
    )

    if active_vehicle_trip:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already has an active trip"
        )

    # --------------------------------------------------------
    # Coordinates
    # --------------------------------------------------------

    pickup_latitude = data.pickup_latitude
    pickup_longitude = data.pickup_longitude

    destination_latitude = data.destination_latitude
    destination_longitude = data.destination_longitude

    # --------------------------------------------------------
    # Geocode origin
    # --------------------------------------------------------

    if (
        pickup_latitude is None
        or pickup_longitude is None
    ):

        origin_coords = geocode_location(
            shipment.origin
        )

        pickup_latitude = origin_coords["latitude"]
        pickup_longitude = origin_coords["longitude"]

    # --------------------------------------------------------
    # Geocode destination
    # --------------------------------------------------------

    if (
        destination_latitude is None
        or destination_longitude is None
    ):

        destination_coords = geocode_location(
            shipment.destination
        )

        destination_latitude = destination_coords["latitude"]
        destination_longitude = destination_coords["longitude"]

    # ========================================================
    # CREATE TRIP
    # ========================================================

    trip = Trip(
        shipment_id=data.shipment_id,
        driver_id=data.driver_id,
        vehicle_id=data.vehicle_id,

        pickup_latitude=pickup_latitude,
        pickup_longitude=pickup_longitude,

        destination_latitude=destination_latitude,
        destination_longitude=destination_longitude,

        status="scheduled",
    )

    db.add(trip)

    db.flush()

    # ========================================================
    # CREATE DRIVER ASSIGNMENT
    # ========================================================

    assignment = DriverAssignment(
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        trip_id=trip.id,

        assignment_status="Assigned",

        remarks="Shipment assigned by dispatcher"
    )

    db.add(assignment)

    # --------------------------------------------------------
    # Mark driver and vehicle as assigned
    # --------------------------------------------------------

    driver.is_available = False
    driver.assigned_vehicle_id = vehicle.id

    vehicle.current_status = "in_transit"
    vehicle.assigned_driver_id = driver.id

    # ========================================================
    # COMMIT
    # ========================================================

    db.commit()

    db.refresh(trip)

    notify_driver_event(
        db=db,
        driver=driver,
        title=f"Trip #{trip.id} Scheduled & Assigned",
        message=f"Trip #{trip.id} scheduled for Shipment #{trip.shipment_id} with Vehicle #{trip.vehicle_id}.",
        category="trip_status",
        priority="high",
        reference_type="trip",
        reference_id=trip.id,
        channel_email=True,
        channel_sms=True,
    )

    return trip


# ============================================================
# UPDATE TRIP STATUS
# ============================================================

def update_trip_status(
    trip_id: int,
    new_status: str,
    db: Session
):

    trip = get_trip(
        trip_id,
        db
    )

    valid_statuses = {
        "scheduled",
        "started",
        "completed",
        "cancelled",
    }

    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    if new_status == trip.status:
        return trip

    # ========================================================
    # START TRIP
    # ========================================================

    if new_status == "started":

        if trip.status != "scheduled":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Trip can only be started "
                    "from scheduled state"
                )
            )

        trip.start_time = datetime.utcnow()

    # ========================================================
    # COMPLETE TRIP
    # ========================================================

    if new_status == "completed":

        if trip.status != "started":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Trip can only be completed "
                    "after it has started"
                )
            )

        trip.end_time = datetime.utcnow()

        # ----------------------------------------------------
        # Get related records
        # ----------------------------------------------------

        driver = (
            db.query(Driver)
            .filter(
                Driver.id == trip.driver_id
            )
            .first()
        )

        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id == trip.vehicle_id
            )
            .first()
        )

        shipment = (
            db.query(Shipment)
            .filter(
                Shipment.id == trip.shipment_id
            )
            .first()
        )

        # ----------------------------------------------------
        # Release driver
        # ----------------------------------------------------

        if driver:

            driver.is_available = True

            driver.assigned_vehicle_id = None

            driver.completed_trips_count += 1

        # ----------------------------------------------------
        # Release vehicle
        # ----------------------------------------------------

        if vehicle:

            vehicle.current_status = "available"

            vehicle.assigned_driver_id = None

        # ----------------------------------------------------
        # Complete shipment
        # ----------------------------------------------------

        if shipment:

            shipment.status = "delivered"

            shipment.delivered_at = datetime.utcnow()

        # ----------------------------------------------------
        # Complete assignment
        # ----------------------------------------------------

        assignment = (
            db.query(DriverAssignment)
            .filter(
                DriverAssignment.trip_id == trip.id
            )
            .first()
        )

        if assignment:

            assignment.assignment_status = "Completed"

    # ========================================================
    # CANCEL TRIP
    # ========================================================

    if new_status == "cancelled":

        if trip.status == "completed":
            raise HTTPException(
                status_code=400,
                detail="Cannot cancel a completed trip"
            )

        trip.end_time = datetime.utcnow()

        # ----------------------------------------------------
        # Get related records
        # ----------------------------------------------------

        driver = (
            db.query(Driver)
            .filter(
                Driver.id == trip.driver_id
            )
            .first()
        )

        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id == trip.vehicle_id
            )
            .first()
        )

        shipment = (
            db.query(Shipment)
            .filter(
                Shipment.id == trip.shipment_id
            )
            .first()
        )

        # ----------------------------------------------------
        # Release driver
        # ----------------------------------------------------

        if driver:

            driver.is_available = True

            driver.assigned_vehicle_id = None

        # ----------------------------------------------------
        # Release vehicle
        # ----------------------------------------------------

        if vehicle:

            vehicle.current_status = "available"

            vehicle.assigned_driver_id = None

        # ----------------------------------------------------
        # Cancel shipment
        # ----------------------------------------------------

        if shipment:

            shipment.status = "cancelled"

        # ----------------------------------------------------
        # Cancel assignment
        # ----------------------------------------------------

        assignment = (
            db.query(DriverAssignment)
            .filter(
                DriverAssignment.trip_id == trip.id
            )
            .first()
        )

        if assignment:

            assignment.assignment_status = "Cancelled"

    # ========================================================
    # UPDATE STATUS
    # ========================================================

    trip.status = new_status

    db.commit()

    db.refresh(trip)

    if new_status == "started":
        notify_event(
            db=db,
            title=f"Trip #{trip.id} Started",
            message=f"Trip #{trip.id} has officially started.",
            category="trip_status",
            reference_type="trip",
            reference_id=trip.id,
        )
    elif new_status == "completed":
        notify_event(
            db=db,
            title=f"Trip #{trip.id} Completed",
            message=f"Trip #{trip.id} has been completed successfully.",
            category="trip_status",
            reference_type="trip",
            reference_id=trip.id,
        )
    elif new_status == "cancelled":
        notify_event(
            db=db,
            title=f"Trip #{trip.id} Cancelled",
            message=f"Trip #{trip.id} has been cancelled.",
            category="trip_status",
            priority="high",
            reference_type="trip",
            reference_id=trip.id,
        )

    return trip


# ============================================================
# DELETE TRIP
# ============================================================

def delete_trip(
    trip_id: int,
    db: Session
):

    trip = get_trip(
        trip_id,
        db
    )

    db.delete(trip)

    db.commit()