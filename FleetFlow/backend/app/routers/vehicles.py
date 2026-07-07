from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import RoleEnum, User, Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleRead, VehicleUpdate
from app.services.security import get_current_user, require_roles


router = APIRouter()


def _get_vehicle_or_404(db: Session, vehicle_id: int) -> Vehicle:
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


@router.post(
    "",
    response_model=VehicleRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER))],
)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)) -> VehicleRead:
    existing_vehicle = db.query(Vehicle).filter(Vehicle.registration_number == payload.registration_number).first()
    if existing_vehicle:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration number already exists")

    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return VehicleRead.model_validate(vehicle)


@router.get("", response_model=list[VehicleRead])
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[VehicleRead]:
    vehicles = db.query(Vehicle).order_by(Vehicle.id.asc()).all()
    return [VehicleRead.model_validate(vehicle) for vehicle in vehicles]


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> VehicleRead:
    vehicle = _get_vehicle_or_404(db, vehicle_id)
    return VehicleRead.model_validate(vehicle)


@router.put(
    "/{vehicle_id}",
    response_model=VehicleRead,
    dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER))],
)
def update_vehicle(vehicle_id: int, payload: VehicleUpdate, db: Session = Depends(get_db)) -> VehicleRead:
    vehicle = _get_vehicle_or_404(db, vehicle_id)
    updates = payload.model_dump(exclude_unset=True)

    if "registration_number" in updates:
        duplicate = (
            db.query(Vehicle)
            .filter(Vehicle.registration_number == updates["registration_number"], Vehicle.id != vehicle_id)
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration number already exists")

    for field, value in updates.items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return VehicleRead.model_validate(vehicle)


@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER))],
)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)) -> None:
    vehicle = _get_vehicle_or_404(db, vehicle_id)
    db.delete(vehicle)
    db.commit()
