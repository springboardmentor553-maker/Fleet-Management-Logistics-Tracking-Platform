from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.driver import DriverCreate, DriverUpdate, DriverResponse
from app.services.driver_service import (
    create_driver,
    get_all_drivers,
    get_driver,
    update_driver,
    delete_driver,
)

router = APIRouter(
    prefix="/drivers",
    tags=["Driver Management"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=DriverResponse)
def add_driver(driver: DriverCreate, db: Session = Depends(get_db)):
    return create_driver(driver, db)


@router.get("/", response_model=list[DriverResponse])
def fetch_drivers(db: Session = Depends(get_db)):
    return get_all_drivers(db)


@router.get("/{driver_id}", response_model=DriverResponse)
def fetch_driver(driver_id: int, db: Session = Depends(get_db)):
    return get_driver(driver_id, db)


@router.put("/{driver_id}", response_model=DriverResponse)
def edit_driver(driver_id: int, driver: DriverUpdate, db: Session = Depends(get_db)):
    return update_driver(driver_id, driver, db)


@router.delete("/{driver_id}")
def remove_driver(driver_id: int, db: Session = Depends(get_db)):
    return delete_driver(driver_id, db)