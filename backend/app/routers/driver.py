from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver
from app.dependencies import administrator_required

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_driver(
    name: str,
    phone: str,
    license_number: str,
    user=Depends(administrator_required)
):
    db = SessionLocal()

    driver = Driver(
        name=name,
        phone=phone,
        license_number=license_number
    )

    db.add(driver)
    db.commit()
    db.refresh(driver)
    db.close()

    return {
        "message": "Driver created successfully",
        "driver": driver
    }


@router.get("/")
def get_drivers(user=Depends(administrator_required)):

    db = SessionLocal()
    drivers = db.query(Driver).all()
    db.close()
    return drivers

@router.put("/{driver_id}")
def update_driver(driver_id: int, name: str, phone: str, license_number: str, user=Depends(administrator_required)):

    db = SessionLocal()

    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        db.close()
        return {"message": "Driver not found"}

    driver.name = name
    driver.phone = phone
    driver.license_number = license_number

    db.commit()
    db.refresh(driver)
    db.close()

    return {
        "message": "Driver updated successfully",
        "driver": driver
    }

@router.delete("/{driver_id}")
def delete_driver(driver_id: int, user=Depends(administrator_required)):


    db = SessionLocal()

    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        db.close()
        return {"message": "Driver not found"}

    db.delete(driver)
    db.commit()
    db.close()

    return {"message": "Driver deleted successfully"}