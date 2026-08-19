from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver
from app.dependencies import fleet_manager_required,driver_view_required
from pydantic import BaseModel


class DriverCreate(BaseModel):
    name: str
    phone: str
    license_number: str

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
        return {"message": "Driver not found"}

    driver.name = name
    driver.phone = phone
    driver.license_number = license_number

    db.commit()
    db.refresh(driver)

    return {
        "message": "Driver updated successfully",
        "driver": driver
    }


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
        return {"message": "Driver not found"}

    db.delete(driver)
    db.commit()

    return {
        "message": "Driver deleted successfully"
    } 