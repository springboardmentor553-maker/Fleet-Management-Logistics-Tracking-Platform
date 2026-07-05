from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


def get_all_vehicles(db: Session) -> list[Vehicle]:
    return db.query(Vehicle).order_by(Vehicle.id).all()


def get_vehicle_by_id(vehicle_id: int, db: Session) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


def create_vehicle(data: VehicleCreate, db: Session) -> Vehicle:
    if db.query(Vehicle).filter(Vehicle.plate_number == data.plate_number).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plate number already registered")
    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def update_vehicle(vehicle_id: int, data: VehicleUpdate, db: Session) -> Vehicle:
    vehicle = get_vehicle_by_id(vehicle_id, db)
    changes = data.model_dump(exclude_unset=True)
    if "plate_number" in changes:
        conflict = db.query(Vehicle).filter(
            Vehicle.plate_number == changes["plate_number"],
            Vehicle.id != vehicle_id
        ).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plate number already in use")
    for field, value in changes.items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(vehicle_id: int, db: Session) -> None:
    vehicle = get_vehicle_by_id(vehicle_id, db)
    db.delete(vehicle)
    db.commit()
