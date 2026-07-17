from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate


def create_vehicle(
    db: Session,
    vehicle: VehicleCreate
):

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

    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


def get_vehicles(
    db: Session
):

    return db.query(Vehicle).all()


def update_vehicle(
    db: Session,
    vehicle_id: int,
    vehicle: VehicleCreate
):

    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if db_vehicle is None:
        return None

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

    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if db_vehicle is None:
        return None

    db.delete(db_vehicle)
    db.commit()

    return db_vehicle