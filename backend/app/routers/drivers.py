from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.post("/", response_model=schemas.DriverResponse)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
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
def update_driver(driver_id: int, updated: schemas.DriverCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    for key, value in updated.dict().items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "fleet_manager"))):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    assigned_vehicle = db.query(models.Vehicle).filter(models.Vehicle.assigned_driver_id == driver_id).first()
    if assigned_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete — driver is assigned to vehicle {assigned_vehicle.registration_number}"
        )

    assigned_shipment = db.query(models.Shipment).filter(models.Shipment.driver_id == driver_id).first()
    if assigned_shipment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete — driver is assigned to shipment {assigned_shipment.tracking_id}"
        )

    db.delete(driver)
    db.commit()
    return {"message": "Driver deleted successfully"}