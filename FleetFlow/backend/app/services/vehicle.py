from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.schemas.vehicle import VehicleCreate


def create_vehicle(
    db: Session,
    vehicle: VehicleCreate
):

    if vehicle.driver_id is not None:

        driver = (
            db.query(Driver)
            .filter(Driver.id == vehicle.driver_id)
            .first()
        )

        if driver is None:
            raise ValueError("Driver not found")

        if not driver.is_active:
            raise ValueError("Driver is inactive")

        if driver.status != "Available":
            raise ValueError(
                "Driver is not available"
            )

        if driver.vehicle is not None:
            raise ValueError(
                "Driver is already assigned to another vehicle"
            )

    db_vehicle = Vehicle(
        driver_id=vehicle.driver_id,
        registration_number=vehicle.registration_number,
        vehicle_type=vehicle.vehicle_type,
        capacity=vehicle.capacity,
        fuel_type=vehicle.fuel_type,
        current_status=vehicle.current_status
    )

    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)

    return db_vehicle


def get_vehicle(
    db: Session,
    vehicle_id: int
):

    return (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )


def get_vehicles(
    db: Session
):

    return db.query(Vehicle).all()


def update_vehicle(
    db: Session,
    vehicle_id: int,
    vehicle: VehicleCreate
):

    db_vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if db_vehicle is None:
        return None

    if not db_vehicle.is_active:
        raise ValueError(
            "Inactive vehicles cannot be edited"
        )

    if vehicle.driver_id is not None:

        driver = (
            db.query(Driver)
            .filter(Driver.id == vehicle.driver_id)
            .first()
        )

        if driver is None:
            raise ValueError("Driver not found")

        if not driver.is_active:
            raise ValueError("Driver is inactive")

        if driver.status != "Available":
            raise ValueError(
                "Driver is not available"
            )

        if (
            driver.vehicle is not None
            and driver.vehicle.id != vehicle_id
        ):
            raise ValueError(
                "Driver is already assigned to another vehicle"
            )

    db_vehicle.driver_id = vehicle.driver_id
    db_vehicle.registration_number = vehicle.registration_number
    db_vehicle.vehicle_type = vehicle.vehicle_type
    db_vehicle.capacity = vehicle.capacity
    db_vehicle.fuel_type = vehicle.fuel_type
    db_vehicle.current_status = vehicle.current_status

    db.commit()
    db.refresh(db_vehicle)

    return db_vehicle


def delete_vehicle(
    db: Session,
    vehicle_id: int
):

    db_vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if db_vehicle is None:
        return None

    db_vehicle.is_active = False
    db_vehicle.current_status = "Inactive"

    if db_vehicle.driver is not None:

        db_vehicle.driver.status = "Available"
        db_vehicle.driver_id = None

    db.commit()
    db.refresh(db_vehicle)

    return db_vehicle