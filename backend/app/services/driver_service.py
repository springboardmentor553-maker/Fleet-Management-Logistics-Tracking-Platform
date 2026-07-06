from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverUpdate


def create_driver(driver: DriverCreate, db: Session):
    existing_driver = db.query(Driver).filter(Driver.license_number == driver.license_number).first()
    if existing_driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver with this license number already exists",
        )

    db_driver = Driver(
        name=driver.name,
        license_number=driver.license_number,
        phone=driver.phone,
        status=driver.status,
    )
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver


def get_all_drivers(db: Session):
    return db.query(Driver).all()


def get_driver(driver_id: int, db: Session):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found",
        )
    return driver


def update_driver(driver_id: int, driver: DriverUpdate, db: Session):
    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found",
        )

    duplicate = (
        db.query(Driver)
        .filter(Driver.license_number == driver.license_number, Driver.id != driver_id)
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver with this license number already exists",
        )

    db_driver.name = driver.name
    db_driver.license_number = driver.license_number
    db_driver.phone = driver.phone
    db_driver.status = driver.status
    db.commit()
    db.refresh(db_driver)
    return db_driver


def delete_driver(driver_id: int, db: Session):
    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found",
        )

    db.delete(db_driver)
    db.commit()
    return {"message": "Driver deleted successfully"}