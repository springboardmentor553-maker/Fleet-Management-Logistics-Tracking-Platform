from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.post("/", response_model=schemas.DriverResponse)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Driver).filter(
        models.Driver.license_number == driver.license_number
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver already registered")

    new_driver = models.Driver(**driver.dict())
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver


@router.get("/", response_model=list[schemas.DriverResponse])
def list_drivers(db: Session = Depends(get_db)):
    return db.query(models.Driver).all()


@router.get("/{driver_id}", response_model=schemas.DriverResponse)
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


@router.put("/{driver_id}", response_model=schemas.DriverResponse)
def update_driver(driver_id: int, updated: schemas.DriverCreate, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    for key, value in updated.dict().items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    db.delete(driver)
    db.commit()
    return {"message": "Driver deleted successfully"}