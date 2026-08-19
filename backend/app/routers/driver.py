<<<<<<< HEAD
from fastapi import APIRouter, Depends,HTTPException
=======
from fastapi import APIRouter, Depends
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver
<<<<<<< HEAD
from app.dependencies import fleet_manager_required,driver_view_required
from pydantic import BaseModel


class DriverCreate(BaseModel):
    name: str
    phone: str
    license_number: str
=======
from app.utils.dependencies import administrator_required
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

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


<<<<<<< HEAD
# Create Driver
@router.post("/")
def create_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db),
    user=Depends(fleet_manager_required)
):

    existing_driver = db.query(Driver).filter(
        Driver.license_number == driver.license_number
    ).first()

    if existing_driver:
        raise HTTPException(
            status_code=400,
            detail="License number already exists"
        )

    new_driver = Driver(
        name=driver.name,
        phone=driver.phone,
        license_number=driver.license_number,
        status="Available"
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return {
        "message": "Driver created successfully",
        "driver": {
            "driver_id": new_driver.driver_id,
            "name": new_driver.name,
            "phone": new_driver.phone,
            "license_number": new_driver.license_number,
            "status": new_driver.status
        }
    }

# Get All Drivers
@router.get("/")
def get_drivers(
    user=Depends(driver_view_required),
    db: Session = Depends(get_db)
):
    return db.query(Driver).all()


# Get Driver By ID
@router.get("/{driver_id}")
def get_driver(
    driver_id: int,
    user=Depends(driver_view_required),
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
        return {"message": "Driver not found"}

    return driver


# Update Driver
@router.put("/{driver_id}")
def update_driver(
    driver_id: int,
    name: str,
    phone: str,
    license_number: str,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
=======
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
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
        return {"message": "Driver not found"}

    driver.name = name
    driver.phone = phone
    driver.license_number = license_number

    db.commit()
    db.refresh(driver)
<<<<<<< HEAD
=======
    db.close()
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

    return {
        "message": "Driver updated successfully",
        "driver": driver
    }

<<<<<<< HEAD

# Delete Driver
@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
=======
@router.delete("/{driver_id}")
def delete_driver(driver_id: int, user=Depends(administrator_required)):


    db = SessionLocal()

    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        db.close()
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
        return {"message": "Driver not found"}

    db.delete(driver)
    db.commit()
<<<<<<< HEAD

    return {
        "message": "Driver deleted successfully"
    } 
=======
    db.close()

    return {"message": "Driver deleted successfully"}
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
