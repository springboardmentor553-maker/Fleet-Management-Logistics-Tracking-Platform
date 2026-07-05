from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverUpdate


def get_all_drivers(db: Session) -> list[Driver]:
    return db.query(Driver).order_by(Driver.id).all()


def get_driver_by_id(driver_id: int, db: Session) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


def create_driver(data: DriverCreate, db: Session) -> Driver:
    if db.query(Driver).filter(Driver.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if db.query(Driver).filter(Driver.license_number == data.license_number).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License number already registered")
    driver = Driver(**data.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


def update_driver(driver_id: int, data: DriverUpdate, db: Session) -> Driver:
    driver = get_driver_by_id(driver_id, db)
    changes = data.model_dump(exclude_unset=True)
    if "email" in changes:
        conflict = db.query(Driver).filter(Driver.email == changes["email"], Driver.id != driver_id).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
    if "license_number" in changes:
        conflict = db.query(Driver).filter(Driver.license_number == changes["license_number"], Driver.id != driver_id).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License number already in use")
    for field, value in changes.items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return driver


def delete_driver(driver_id: int, db: Session) -> None:
    driver = get_driver_by_id(driver_id, db)
    db.delete(driver)
    db.commit()
