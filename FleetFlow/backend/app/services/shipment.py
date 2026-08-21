from sqlalchemy.orm import Session

from app.models.shipment import Shipment
from app.models.vehicle import Vehicle
from app.models.driver import Driver

from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate
)

from app.enums.shipment_status import ShipmentStatus


def generate_tracking_number(db: Session):

    last_shipment = (
        db.query(Shipment)
        .order_by(Shipment.id.desc())
        .first()
    )

    if last_shipment:
        next_number = last_shipment.id + 1
    else:
        next_number = 1

    return f"FLT{100000 + next_number}"


def get_available_vehicle(
    db: Session,
    vehicle_id: int
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if vehicle is None:
        raise ValueError(
            "Vehicle not found"
        )

    if not vehicle.is_active:
        raise ValueError(
            "Vehicle is inactive"
        )

    if vehicle.current_status != "Available":
        raise ValueError(
            "Vehicle is not available"
        )

    if vehicle.driver is None:
        raise ValueError(
            "Vehicle does not have an assigned driver"
        )

    if not vehicle.driver.is_active:
        raise ValueError(
            "Vehicle's driver is inactive"
        )

    if vehicle.driver.status != "Available":
        raise ValueError(
            "Vehicle's driver is not available"
        )

    return vehicle


def create_shipment(
    db: Session,
    shipment: ShipmentCreate
):

    vehicle = None
    driver_id = None

    # Vehicle/driver are optional when creating
    # a shipment. They can be assigned later.

    if shipment.vehicle_id is not None:

        vehicle = get_available_vehicle(
            db,
            shipment.vehicle_id
        )

        driver_id = vehicle.driver_id

    elif shipment.driver_id is not None:

        driver = (
            db.query(Driver)
            .filter(Driver.id == shipment.driver_id)
            .first()
        )

        if driver is None:
            raise ValueError(
                "Driver not found"
            )

        if not driver.is_active:
            raise ValueError(
                "Driver is inactive"
            )

        if driver.status != "Available":
            raise ValueError(
                "Driver is not available"
            )

        if driver.vehicle is None:
            raise ValueError(
                "Driver does not have an assigned vehicle"
            )

        if not driver.vehicle.is_active:
            raise ValueError(
                "Driver's vehicle is inactive"
            )

        if driver.vehicle.current_status != "Available":
            raise ValueError(
                "Driver's vehicle is not available"
            )

        vehicle = driver.vehicle
        driver_id = driver.id

    db_shipment = Shipment(

        tracking_number=generate_tracking_number(db),

        sender_name=shipment.sender_name,

        receiver_name=shipment.receiver_name,

        pickup_location=shipment.pickup_location,

        delivery_location=shipment.delivery_location,

        weight=shipment.weight,

        driver_id=driver_id,

        vehicle_id=vehicle.id if vehicle else None,

        current_status=ShipmentStatus.CREATED.value
    )

    db.add(db_shipment)

    db.commit()

    db.refresh(db_shipment)

    return db_shipment


def get_all_shipments(db: Session):
    return db.query(Shipment).all()


def get_shipment_by_id(
    db: Session,
    shipment_id: int
):

    return (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )


def update_shipment(
    db: Session,
    shipment_id: int,
    shipment: ShipmentUpdate
):

    db_shipment = get_shipment_by_id(
        db,
        shipment_id
    )

    if not db_shipment:
        return None

    update_data = shipment.model_dump(
        exclude_unset=True
    )

    # If a vehicle is being assigned,
    # determine the driver from that vehicle.
    if "vehicle_id" in update_data:

        vehicle_id = update_data["vehicle_id"]

        if vehicle_id is None:

            update_data["driver_id"] = None

        else:

            vehicle = get_available_vehicle(
                db,
                vehicle_id
            )

            update_data["vehicle_id"] = vehicle.id
            update_data["driver_id"] = vehicle.driver_id

    elif "driver_id" in update_data:

        driver_id = update_data["driver_id"]

        if driver_id is None:

            update_data["vehicle_id"] = None

        else:

            driver = (
                db.query(Driver)
                .filter(Driver.id == driver_id)
                .first()
            )

            if driver is None:
                raise ValueError(
                    "Driver not found"
                )

            if not driver.is_active:
                raise ValueError(
                    "Driver is inactive"
                )

            if driver.status != "Available":
                raise ValueError(
                    "Driver is not available"
                )

            if driver.vehicle is None:
                raise ValueError(
                    "Driver does not have an assigned vehicle"
                )

            if not driver.vehicle.is_active:
                raise ValueError(
                    "Driver's vehicle is inactive"
                )

            if driver.vehicle.current_status != "Available":
                raise ValueError(
                    "Driver's vehicle is not available"
                )

            update_data["driver_id"] = driver.id
            update_data["vehicle_id"] = driver.vehicle.id

    for key, value in update_data.items():

        if key == "current_status":
            value = value.value

        setattr(
            db_shipment,
            key,
            value
        )

    db.commit()

    db.refresh(db_shipment)

    return db_shipment


def delete_shipment(
    db: Session,
    shipment_id: int
):

    db_shipment = get_shipment_by_id(
        db,
        shipment_id
    )

    if not db_shipment:
        return None

    db.delete(db_shipment)

    db.commit()

    return db_shipment