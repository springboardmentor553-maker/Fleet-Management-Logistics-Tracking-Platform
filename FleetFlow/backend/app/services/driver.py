from sqlalchemy.orm import Session
from app.models.driver import Driver
from app.schemas.driver import DriverCreate

def create_driver(
    db: Session,
    driver: DriverCreate
):

    db_driver = Driver(
        user_id=driver.user_id,
        name=driver.name,
        email=driver.email,
        phone_number=driver.phone_number,
        license_number=driver.license_number,
        status=driver.status
    )

    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)

    return db_driver

def get_driver(
    db: Session,
    driver_id: int
):

    return db.query(Driver).filter(Driver.id == driver_id).first()

def get_drivers(
    db: Session
):

    return db.query(Driver).all()

def update_driver(
    db: Session,
    driver_id: int,
    driver: DriverCreate
):

    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if db_driver is None:
        return None

    db_driver.name = driver.name
    db_driver.email = driver.email
    db_driver.phone_number = driver.phone_number
    db_driver.license_number = driver.license_number
    db_driver.status = driver.status

    db.commit()
    db.refresh(db_driver)

    return db_driver

def delete_driver(
    db: Session,
    driver_id: int
):

    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if db_driver is None:
        return None

    db.delete(db_driver)
    db.commit()

    return db_driver

