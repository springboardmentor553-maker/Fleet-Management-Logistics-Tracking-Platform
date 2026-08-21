from sqlalchemy.orm import Session

from app.models.driver_assignment import DriverAssignment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip

from app.schemas.driver_assignment import (
    DriverAssignmentCreate,
    DriverAssignmentUpdate
)


def create_assignment(
    db: Session,
    assignment: DriverAssignmentCreate
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == assignment.driver_id)
        .first()
    )

    if not driver:
        raise ValueError("Driver not found")

    if driver.status != "Available":
        raise ValueError("Driver is not available")

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == assignment.vehicle_id)
        .first()
    )

    if not vehicle:
        raise ValueError("Vehicle not found")

    if not vehicle.is_active:
        raise ValueError("Vehicle is inactive")

    if vehicle.current_status != "Available":
        raise ValueError("Vehicle is not available")

    trip = (
        db.query(Trip)
        .filter(Trip.id == assignment.trip_id)
        .first()
    )

    if not trip:
        raise ValueError("Trip not found")

    # Check whether this driver already has
    # another active assignment.
    active_driver_assignment = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.driver_id == assignment.driver_id,
            DriverAssignment.assignment_status == "Active"
        )
        .first()
    )

    if active_driver_assignment:
        raise ValueError(
            "Driver already has an active assignment"
        )

    # Check whether this vehicle already has
    # another active assignment.
    active_vehicle_assignment = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.vehicle_id == assignment.vehicle_id,
            DriverAssignment.assignment_status == "Active"
        )
        .first()
    )

    if active_vehicle_assignment:
        raise ValueError(
            "Vehicle already has an active assignment"
        )

    # Check whether this trip is already assigned.
    active_trip_assignment = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.trip_id == assignment.trip_id,
            DriverAssignment.assignment_status == "Active"
        )
        .first()
    )

    if active_trip_assignment:
        raise ValueError(
            "Trip already has an active assignment"
        )

    db_assignment = DriverAssignment(
        driver_id=assignment.driver_id,
        vehicle_id=assignment.vehicle_id,
        trip_id=assignment.trip_id,
        assignment_status=assignment.assignment_status,
        remarks=assignment.remarks
    )

    db.add(db_assignment)

    # Driver and vehicle become assigned.
    driver.status = "Assigned"
    vehicle.current_status = "Assigned"

    db.commit()
    db.refresh(db_assignment)

    return db_assignment


def get_all_assignments(db: Session):
    return db.query(DriverAssignment).all()


def get_assignment_by_id(
    db: Session,
    assignment_id: int
):

    return (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.id == assignment_id
        )
        .first()
    )


def update_assignment(
    db: Session,
    assignment_id: int,
    assignment: DriverAssignmentUpdate
):

    db_assignment = get_assignment_by_id(
        db,
        assignment_id
    )

    if not db_assignment:
        return None

    update_data = assignment.model_dump(
        exclude_unset=True
    )

    # Prevent changing an assignment to a trip
    # that already has another active assignment.
    if (
        "trip_id" in update_data
        and update_data["trip_id"] != db_assignment.trip_id
    ):

        active_trip_assignment = (
            db.query(DriverAssignment)
            .filter(
                DriverAssignment.trip_id == update_data["trip_id"],
                DriverAssignment.assignment_status == "Active",
                DriverAssignment.id != assignment_id
            )
            .first()
        )

        if active_trip_assignment:
            raise ValueError(
                "Trip already has an active assignment"
            )

    for key, value in update_data.items():

        setattr(
            db_assignment,
            key,
            value
        )

    db.commit()
    db.refresh(db_assignment)

    return db_assignment


def delete_assignment(
    db: Session,
    assignment_id: int
):

    db_assignment = get_assignment_by_id(
        db,
        assignment_id
    )

    if not db_assignment:
        return None

    driver = db_assignment.driver
    vehicle = db_assignment.vehicle

    db.delete(db_assignment)

    if driver:
        driver.status = "Available"

    if vehicle:
        vehicle.current_status = "Available"

    db.commit()

    return db_assignment