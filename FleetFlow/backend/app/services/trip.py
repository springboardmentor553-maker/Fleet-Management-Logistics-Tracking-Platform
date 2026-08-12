from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.driver import Driver
from app.models.vehicle import Vehicle

from app.schemas.trip import TripCreate, TripUpdate

from app.enums.trip_status import TripStatus
from app.enums.shipment_status import ShipmentStatus
from app.services.shipment import get_shipment_by_id


def create_trip(
    db: Session,
    trip: TripCreate
):

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == trip.shipment_id)
        .first()
    )

    if not shipment:
        raise ValueError("Shipment not found")

    driver = (
        db.query(Driver)
        .filter(Driver.id == trip.driver_id)
        .first()
    )

    if not driver:
        raise ValueError("Driver not found")

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == trip.vehicle_id)
        .first()
    )

    if not vehicle:
        raise ValueError("Vehicle not found")

    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == trip.driver_id,
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

    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == trip.vehicle_id,
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

    db_trip = Trip(
        shipment_id=trip.shipment_id,
        driver_id=trip.driver_id,
        vehicle_id=trip.vehicle_id,
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

            if value == TripStatus.SCHEDULED:
                db_trip.shipment.current_status = (
                    ShipmentStatus.ASSIGNED.value
                )

            elif value in (
                TripStatus.STARTED,
                TripStatus.IN_PROGRESS
            ):
                shipment = get_shipment_by_id(
                    db,
                    db_trip.shipment_id
                )

                shipment.current_status = (
                    ShipmentStatus.IN_TRANSIT.value
                )

            elif value == TripStatus.COMPLETED:
                db_trip.shipment.current_status = (
                    ShipmentStatus.DELIVERED.value
                )

            elif value == TripStatus.CANCELLED:
                db_trip.shipment.current_status = (
                    ShipmentStatus.CANCELLED.value
                )

            value = value.value

        setattr(db_trip, key, value)

    db.commit()
    db.refresh(db_trip)

    return db_trip


def delete_trip(
    db: Session,
    trip_id: int
):

    db_trip = get_trip_by_id(db, trip_id)

    if not db_trip:
        return None

    db.delete(db_trip)

    db.commit()

    return db_trip