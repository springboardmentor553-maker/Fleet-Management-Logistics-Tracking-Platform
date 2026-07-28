from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.schemas.driver import DriverCreate
router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)
@router.post("/")
def add_driver(driver: DriverCreate, db: Session = Depends(get_db)):
    new_driver = Driver(
    full_name=driver.full_name,
    email=driver.email,
    phone=driver.phone,
    license_number=driver.license_number,
    experience=driver.experience,
    status=driver.status
    )
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return {
        "message": "Driver added successfully",
        "driver": new_driver
    }
@router.get("/")
def get_all_drivers(db: Session = Depends(get_db)):
    drivers = db.query(Driver).all()

    return {
        "total_drivers": len(drivers),
        "drivers": drivers
    }
@router.get("/{driver_id}")
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        return {
            "message": "Driver not found"
        }

    return driver


# ----------------------------
# Update Driver
# ----------------------------
@router.put("/{driver_id}")
def update_driver(driver_id: int, driver: DriverCreate, db: Session = Depends(get_db)):
    existing_driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not existing_driver:
        return {
            "message": "Driver not found"
        }

    existing_driver.full_name = driver.full_name
    existing_driver.email = driver.email
    existing_driver.phone = driver.phone
    existing_driver.license_number = driver.license_number
    existing_driver.experience = driver.experience
    existing_driver.status = driver.status

    db.commit()
    db.refresh(existing_driver)

    return {
        "message": "Driver updated successfully",
        "driver": existing_driver
    }


# ----------------------------
# Delete Driver
# ----------------------------
@router.delete("/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        return {
            "message": "Driver not found"
        }

    db.delete(driver)
    db.commit()

    return {
        "message": "Driver deleted successfully"
    }