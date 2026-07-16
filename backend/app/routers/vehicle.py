from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.utils.security import has_role
from app.services.vehicle_service import (
    create_vehicle,
    get_all_vehicles,
    get_vehicle,
    update_vehicle,
    delete_vehicle,
)

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicle Management"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=VehicleResponse)
def add_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Fleet Manager"]))):
    return create_vehicle(vehicle, db)


@router.get("/", response_model=List[VehicleResponse])
def fetch_all_vehicles(db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Fleet Manager", "Dispatcher"]))):
    return get_all_vehicles(db)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def fetch_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Fleet Manager", "Dispatcher"]))):
    return get_vehicle(vehicle_id, db)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def edit_vehicle(vehicle_id: int, vehicle: VehicleUpdate, db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Fleet Manager"]))):
    return update_vehicle(vehicle_id, vehicle, db)


@router.delete("/{vehicle_id}")
def remove_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user = Depends(has_role(["Admin", "Fleet Manager"]))):
    return delete_vehicle(vehicle_id, db)