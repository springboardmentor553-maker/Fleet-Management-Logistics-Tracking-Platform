from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.schemas.driver import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
)

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


# Create Driver
@router.post("/", response_model=DriverResponse)
def create_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db)
):
    existing_license = db.query(Driver).filter(
        Driver.license_number == driver.license_number
    ).first()

    if existing_license:
        raise HTTPException(
            status_code=400,
            detail="License number already exists"
        )

    existing_email = db.query(Driver).filter(
        Driver.email == driver.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    new_driver = Driver(
        name=driver.name,
        license_number=driver.license_number,
        phone=driver.phone,
        email=driver.email,
        status=driver.status,
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return new_driver


# Get All Drivers
@router.get("/", response_model=list[DriverResponse])
def get_all_drivers(
    db: Session = Depends(get_db)
):
    return db.query(Driver).all()


# Get Driver By ID
@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return driver


# Update Driver
@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: int,
    updated_driver: DriverUpdate,
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    data = updated_driver.model_dump(exclude_unset=True)

    if "license_number" in data:
        existing = db.query(Driver).filter(
            Driver.license_number == data["license_number"],
            Driver.id != driver_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="License number already exists"
            )

    if "email" in data:
        existing = db.query(Driver).filter(
            Driver.email == data["email"],
            Driver.id != driver_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

    for key, value in data.items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)

    return driver


# Delete Driver
@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    db.delete(driver)
    db.commit()

    return {
        "message": "Driver deleted successfully"
    }