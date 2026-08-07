from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.fuel_record import FuelRecordCreate, FuelRecordResponse
from app.services.fuel_record_service import (
    create_fuel_record,
    get_all_fuel_records,
    get_fuel_record,
    get_vehicle_fuel_records,
    get_fuel_analytics,
)

router = APIRouter(
    prefix="/fuel-records",
    tags=["Fuel Monitoring"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=FuelRecordResponse)
def add_fuel_record(record: FuelRecordCreate, db: Session = Depends(get_db)):
    return create_fuel_record(record, db)


@router.get("/", response_model=list[FuelRecordResponse])
def fetch_fuel_records(db: Session = Depends(get_db)):
    return get_all_fuel_records(db)


@router.get("/analytics")
def fetch_fuel_analytics(db: Session = Depends(get_db)):
    return get_fuel_analytics(db)


@router.get("/{record_id}", response_model=FuelRecordResponse)
def fetch_fuel_record(record_id: int, db: Session = Depends(get_db)):
    return get_fuel_record(record_id, db)


@router.get("/vehicle/{vehicle_id}", response_model=list[FuelRecordResponse])
def fetch_vehicle_fuel_records(vehicle_id: int, db: Session = Depends(get_db)):
    return get_vehicle_fuel_records(vehicle_id, db)