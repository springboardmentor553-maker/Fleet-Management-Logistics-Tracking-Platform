from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


def create_vehicle(vehicle: VehicleCreate, db: Session):
    existing_vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.vehicle_number == vehicle.vehicle_number)
        .first()
    )
    if existing_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle with this vehicle number already exists",
        )

    existing_registration = (
        db.query(Vehicle)
        .filter(Vehicle.registration_number == vehicle.registration_number)
        .first()
    )
    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle with this registration number already exists",
        )

    if vehicle.driver_id is not None:
        driver = db.query(Driver).filter(Driver.id == vehicle.driver_id).first()
        if not driver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Driver not found",
            )

    db_vehicle = Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create vehicle because of a database constraint",
        ) from exc

    db.refresh(db_vehicle)
    return db_vehicle


def get_all_vehicles(db: Session):
    return db.query(Vehicle).all()


def get_vehicle(vehicle_id: int, db: Session):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


def update_vehicle(vehicle_id: int, vehicle: VehicleUpdate, db: Session):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    duplicate_vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.vehicle_number == vehicle.vehicle_number, Vehicle.id != vehicle_id)
        .first()
    )
    if duplicate_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle with this vehicle number already exists",
        )

    duplicate_registration = (
        db.query(Vehicle)
        .filter(Vehicle.registration_number == vehicle.registration_number, Vehicle.id != vehicle_id)
        .first()
    )
    if duplicate_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle with this registration number already exists",
        )

    if vehicle.driver_id is not None:
        driver = db.query(Driver).filter(Driver.id == vehicle.driver_id).first()
        if not driver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Driver not found",
            )

    for key, value in vehicle.model_dump().items():
        setattr(db_vehicle, key, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update vehicle because of a database constraint",
        ) from exc

    db.refresh(db_vehicle)
    return db_vehicle


def delete_vehicle(vehicle_id: int, db: Session):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    db.delete(vehicle)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete vehicle because of a database constraint",
        ) from exc

    return {"message": "Vehicle deleted successfully"}