from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.services.vehicle import get_all_vehicles, get_vehicle_by_id, create_vehicle, update_vehicle, delete_vehicle
from app.config import settings

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

_fleet_or_admin = require_roles(Role.FLEET_MANAGER, Role.ADMIN)


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_all_vehicles(db)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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


# =========================================================
# FUEL STATUS & FUEL LEVEL ENDPOINTS
# =========================================================

@router.get("/{vehicle_id}/fuel-status")
def get_vehicle_fuel_status(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vehicle = get_vehicle_by_id(vehicle_id, db)
    fuel = vehicle.fuel_level if vehicle.fuel_level is not None else 100.0

    low_thresh = getattr(settings, "LOW_FUEL_THRESHOLD", 20.0)
    crit_thresh = getattr(settings, "CRITICAL_FUEL_THRESHOLD", 10.0)

    if fuel < crit_thresh:
        fuel_status = "critical"
        priority = "critical"
    elif fuel < low_thresh:
        fuel_status = "low"
        priority = "high"
    elif fuel <= 30.0:
        fuel_status = "warning"
        priority = "normal"
    else:
        fuel_status = "normal"
        priority = "normal"

    return {
        "vehicle_id": vehicle.id,
        "vehicle_number": vehicle.plate_number,
        "fuel_percentage": round(fuel, 1),
        "status": fuel_status,
        "priority": priority,
        "threshold": low_thresh,
        "critical_threshold": crit_thresh,
    }


from pydantic import BaseModel, Field, field_validator

class FuelLevelUpdate(BaseModel):
    fuel_level: float = Field(..., description="Fuel level percentage (0.0 - 100.0)")

    @field_validator("fuel_level")
    @classmethod
    def validate_range(cls, v: float) -> float:
        if v < 0.0 or v > 100.0:
            raise ValueError("Fuel level percentage must be between 0.0% and 100.0%")
        return v


@router.put("/{vehicle_id}/fuel-level", response_model=VehicleResponse)
def update_vehicle_fuel_level(
    vehicle_id: int,
    payload: FuelLevelUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_fleet_or_admin),
):
    from app.schemas.vehicle import VehicleUpdate
    return update_vehicle(vehicle_id, VehicleUpdate(fuel_level=payload.fuel_level), db)

