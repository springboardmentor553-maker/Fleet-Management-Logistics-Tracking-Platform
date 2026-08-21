from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.driver_assignment import DriverAssignment

from app.schemas.trip import TripCreate, TripUpdate

from app.enums.trip_status import TripStatus
from app.enums.shipment_status import ShipmentStatus
from app.services.shipment import get_shipment_by_id
from app.services.maps import geocode_address


def create_trip(
    db: Session,
    trip: TripCreate
):

    # Find shipment
    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == trip.shipment_id)
        .first()
    )

    if not shipment:
        raise ValueError("Shipment not found")

    # Shipment must have a vehicle
    if shipment.vehicle_id is None:
        raise ValueError(
            "Shipment does not have an assigned vehicle"
        )

    # Get the vehicle assigned to the shipment
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == shipment.vehicle_id)
        .first()
    )

    if not vehicle:
        raise ValueError(
            "Shipment vehicle not found"
        )

    # Vehicle must be active
    if not vehicle.is_active:
        raise ValueError(
            "Vehicle is inactive"
        )

    # Vehicle must be available
    if vehicle.current_status != "Available":
        raise ValueError(
            "Vehicle is not available"
        )

    # Vehicle must have a driver
    if vehicle.driver_id is None:
        raise ValueError(
            "Vehicle does not have an assigned driver"
        )

    # Get the driver assigned to the vehicle
    driver = (
        db.query(Driver)
        .filter(Driver.id == vehicle.driver_id)
        .first()
    )

    if not driver:
        raise ValueError(
            "Vehicle driver not found"
        )

    # Driver must be active
    if not driver.is_active:
        raise ValueError(
            "Driver is inactive"
        )

    # Driver must be available
    if driver.status != "Available":
        raise ValueError(
            "Driver is not available"
        )

    # Check whether driver already has an active trip
    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == driver.id,
            Trip.trip_status.in_([
                TripStatus.SCHEDULED.value,
                TripStatus.STARTED.value,
                TripStatus.IN_PROGRESS.value
            ])
        )
        .first()
    )

    if active_driver_trip:
        raise ValueError(
            "Driver is already assigned to an active trip"
        )

    # Check whether vehicle already has an active trip
    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == vehicle.id,
            Trip.trip_status.in_([
                TripStatus.SCHEDULED.value,
                TripStatus.STARTED.value,
                TripStatus.IN_PROGRESS.value
            ])
        )
        .first()
    )

    if active_vehicle_trip:
        raise ValueError(
            "Vehicle is already assigned to an active trip"
        )

    # Create trip using the vehicle and driver
    # associated with the shipment
    db_trip = Trip(
        shipment_id=shipment.id,
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        pickup_location=trip.pickup_location,
        delivery_location=trip.delivery_location,
        scheduled_start_time=trip.scheduled_start_time,
        scheduled_end_time=trip.scheduled_end_time,
        trip_status=TripStatus.SCHEDULED.value
    )

    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)

    return db_trip


def get_all_trips(db: Session):
    return db.query(Trip).all()


def get_trip_by_id(
    db: Session,
    trip_id: int
):
    return (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )


def update_trip(
    db: Session,
    trip_id: int,
    trip: TripUpdate
):

    db_trip = get_trip_by_id(db, trip_id)

    if not db_trip:
        return None

    update_data = trip.model_dump(exclude_unset=True)

    for key, value in update_data.items():

        if key == "trip_status":

            # -----------------------------------------
            # SCHEDULED
            # -----------------------------------------
            if value == TripStatus.SCHEDULED:

                db_trip.shipment.current_status = (
                    ShipmentStatus.ASSIGNED.value
                )

            # -----------------------------------------
            # STARTED
            # -----------------------------------------
            elif value == TripStatus.STARTED:

                shipment = get_shipment_by_id(
                    db,
                    db_trip.shipment_id
                )

                shipment.current_status = (
                    ShipmentStatus.IN_TRANSIT.value
                )

                # Initialize vehicle position at pickup
                # when the trip actually starts.
                try:
                    pickup_coordinates = geocode_address(
                        db_trip.pickup_location
                    )

                    # ORS returns [longitude, latitude]
                    db_trip.vehicle.current_longitude = (
                        pickup_coordinates[0]
                    )

                    db_trip.vehicle.current_latitude = (
                        pickup_coordinates[1]
                    )

                except Exception as error:
                    raise ValueError(
                        f"Unable to determine vehicle "
                        f"starting location: {error}"
                    )

                db_trip.started_at = func.now()

            # -----------------------------------------
            # IN PROGRESS
            # -----------------------------------------
            elif value == TripStatus.IN_PROGRESS:

                shipment = get_shipment_by_id(
                    db,
                    db_trip.shipment_id
                )

                shipment.current_status = (
                    ShipmentStatus.IN_TRANSIT.value
                )

            # -----------------------------------------
            # COMPLETED
            # -----------------------------------------
            elif value == TripStatus.COMPLETED:

                db_trip.shipment.current_status = (
                    ShipmentStatus.DELIVERED.value
                )

                # Move the vehicle to the destination
                # when the trip is completed.
                try:
                    destination_coordinates = geocode_address(
                        db_trip.delivery_location
                    )

                    # ORS returns [longitude, latitude]
                    db_trip.vehicle.current_longitude = (
                        destination_coordinates[0]
                    )

                    db_trip.vehicle.current_latitude = (
                        destination_coordinates[1]
                    )

                except Exception as error:
                    raise ValueError(
                        f"Unable to determine vehicle "
                        f"destination location: {error}"
                    )

                db_trip.completed_at = func.now()

                db_trip.driver.status = "Available"
                db_trip.vehicle.current_status = "Available"

                assignment = (
                    db.query(DriverAssignment)
                    .filter(
                        DriverAssignment.trip_id == db_trip.id,
                        DriverAssignment.assignment_status == "Active"
                    )
                    .first()
                )

                if assignment:
                    assignment.assignment_status = "Completed"

            # -----------------------------------------
            # CANCELLED
            # -----------------------------------------
            elif value == TripStatus.CANCELLED:

                db_trip.shipment.current_status = (
                    ShipmentStatus.CANCELLED.value
                )

                # Do NOT change the vehicle's location.
                # It remains at its last known position.

                db_trip.driver.status = "Available"
                db_trip.vehicle.current_status = "Available"

                assignment = (
                    db.query(DriverAssignment)
                    .filter(
                        DriverAssignment.trip_id == db_trip.id,
                        DriverAssignment.assignment_status == "Active"
                    )
                    .first()
                )

                if assignment:
                    assignment.assignment_status = "Cancelled"

            value = value.value

        setattr(
            db_trip,
            key,
            value
        )

    db.commit()
    db.refresh(db_trip)

    return db_trip


def delete_trip(
    db: Session,
    trip_id: int
):

    db_trip = get_trip_by_id(
        db,
        trip_id
    )

    if not db_trip:
        return None

    db.delete(db_trip)

    db.commit()

    return db_trip