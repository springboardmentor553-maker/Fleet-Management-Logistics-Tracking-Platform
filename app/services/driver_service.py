from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverUpdate

from app.services.notification_service import create_notification


# ==========================
# Create Driver
# ==========================

def create_driver(driver: DriverCreate, db: Session):

    existing_driver = (
        db.query(Driver)
        .filter(
            Driver.license_number == driver.license_number
        )
        .first()
    )

    if existing_driver:
        raise HTTPException(
            status_code=400,
            detail="Driver with this license number already exists."
        )

    new_driver = Driver(
        name=driver.name,
        license_number=driver.license_number,
        phone=driver.phone,
        status=driver.status
    )

    db.add(new_driver)

    create_notification(
        db=db,
        title="New Driver Added",
        message=f"Driver '{driver.name}' has been added successfully.",
        type="success"
    )

    db.commit()
    db.refresh(new_driver)

    return new_driver


# ==========================
# Get All Drivers
# ==========================

def get_all_drivers(db: Session):

    return db.query(Driver).all()


# ==========================
# Get Single Driver
# ==========================

def get_driver(driver_id: int, db: Session):

    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return driver


# ==========================
# Update Driver
# ==========================

def update_driver(
    driver_id: int,
    driver: DriverUpdate,
    db: Session
):

    db_driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not db_driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    db_driver.name = driver.name
    db_driver.license_number = driver.license_number
    db_driver.phone = driver.phone
    db_driver.status = driver.status

    create_notification(
        db=db,
        title="Driver Updated",
        message=f"Driver '{driver.name}' information has been updated.",
        type="info"
    )

    db.commit()
    db.refresh(db_driver)

    return db_driver


# ==========================
# Delete Driver
# ==========================

def delete_driver(
    driver_id: int,
    db: Session
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    driver_name = driver.name

    create_notification(
        db=db,
        title="Driver Deleted",
        message=f"Driver '{driver_name}' has been deleted.",
        type="warning"
    )

    db.delete(driver)

    db.commit()

    return {
        "message": "Driver deleted successfully"
    }