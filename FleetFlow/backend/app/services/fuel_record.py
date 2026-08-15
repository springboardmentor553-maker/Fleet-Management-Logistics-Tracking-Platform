from sqlalchemy.orm import Session

from app.models.fuel_record import FuelRecord
from app.models.vehicle import Vehicle
from app.models.driver import Driver

from app.schemas.fuel_record import (
    FuelRecordCreate,
    FuelRecordUpdate
)


def create_fuel_record(
    db: Session,
    fuel_record: FuelRecordCreate
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == fuel_record.vehicle_id)
        .first()
    )

    if not vehicle:
        raise ValueError("Vehicle not found")

    driver = (
        db.query(Driver)
        .filter(Driver.id == fuel_record.driver_id)
        .first()
    )

    if not driver:
        raise ValueError("Driver not found")

    db_fuel_record = FuelRecord(
        vehicle_id=fuel_record.vehicle_id,
        driver_id=fuel_record.driver_id,
        fuel_quantity=fuel_record.fuel_quantity,
        fuel_cost=fuel_record.fuel_cost,
        odometer_reading=fuel_record.odometer_reading,
        fuel_date=fuel_record.fuel_date,
        fuel_station=fuel_record.fuel_station,
        remarks=fuel_record.remarks
    )

    db.add(db_fuel_record)
    db.commit()
    db.refresh(db_fuel_record)

    return db_fuel_record


def get_all_fuel_records(db: Session):
    return db.query(FuelRecord).all()


def get_fuel_record_by_id(
    db: Session,
    fuel_record_id: int
):

    return (
        db.query(FuelRecord)
        .filter(FuelRecord.id == fuel_record_id)
        .first()
    )


def update_fuel_record(
    db: Session,
    fuel_record_id: int,
    fuel_record: FuelRecordUpdate
):

    db_fuel_record = get_fuel_record_by_id(
        db,
        fuel_record_id
    )

    if not db_fuel_record:
        return None

    update_data = fuel_record.model_dump(
        exclude_unset=True
    )

    if "vehicle_id" in update_data:

        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id == update_data["vehicle_id"]
            )
            .first()
        )

        if not vehicle:
            raise ValueError("Vehicle not found")

    if "driver_id" in update_data:

        driver = (
            db.query(Driver)
            .filter(
                Driver.id == update_data["driver_id"]
            )
            .first()
        )

        if not driver:
            raise ValueError("Driver not found")

    for key, value in update_data.items():
        setattr(
            db_fuel_record,
            key,
            value
        )

    db.commit()
    db.refresh(db_fuel_record)

    return db_fuel_record


def delete_fuel_record(
    db: Session,
    fuel_record_id: int
):

    db_fuel_record = get_fuel_record_by_id(
        db,
        fuel_record_id
    )

    if not db_fuel_record:
        return None

    db.delete(db_fuel_record)
    db.commit()

    return db_fuel_record