from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.services.vehicle import get_all_vehicles, get_vehicle_by_id, create_vehicle, update_vehicle, delete_vehicle

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

_fleet_or_admin = require_roles(Role.FLEET_MANAGER, Role.ADMIN)


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(db: Session = Depends(get_db), _: User = Depends(_fleet_or_admin)):
    return get_all_vehicles(db)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(_fleet_or_admin)):
    return get_vehicle_by_id(vehicle_id, db)


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def add_vehicle(data: VehicleCreate, db: Session = Depends(get_db), _: User = Depends(_fleet_or_admin)):
    return create_vehicle(data, db)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle_route(vehicle_id: int, data: VehicleUpdate, db: Session = Depends(get_db), _: User = Depends(_fleet_or_admin)):
    return update_vehicle(vehicle_id, data, db)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle_route(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(_fleet_or_admin)):
    delete_vehicle(vehicle_id, db)
