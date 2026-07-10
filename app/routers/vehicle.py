from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.services.vehicle_service import (
    create_vehicle,
    get_all_vehicles,
    get_vehicle,
    update_vehicle,
    delete_vehicle,
)

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicle Management"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=VehicleResponse)
def add_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    return create_vehicle(vehicle, db)


@router.get("/", response_model=list[VehicleResponse])
def fetch_vehicles(db: Session = Depends(get_db)):
    return get_all_vehicles(db)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def fetch_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    return get_vehicle(vehicle_id, db)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def edit_vehicle(vehicle_id: int, vehicle: VehicleUpdate, db: Session = Depends(get_db)):
    return update_vehicle(vehicle_id, vehicle, db)


@router.delete("/{vehicle_id}")
def remove_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    return delete_vehicle(vehicle_id, db)