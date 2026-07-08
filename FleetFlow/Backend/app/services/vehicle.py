from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


def _check_driver(driver_id: int, db: Session) -> None:
    if not db.query(Driver).filter(Driver.id == driver_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Driver with id {driver_id} not found")


def _query(db: Session):
    return db.query(Vehicle).options(joinedload(Vehicle.assigned_driver))


def get_all_vehicles(db: Session) -> list[Vehicle]:
    return _query(db).order_by(Vehicle.id).all()


def get_vehicle_by_id(vehicle_id: int, db: Session) -> Vehicle:
    vehicle = _query(db).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


def create_vehicle(data: VehicleCreate, db: Session) -> Vehicle:
    if db.query(Vehicle).filter(Vehicle.plate_number == data.plate_number).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plate number already registered")
    if data.assigned_driver_id:
        _check_driver(data.assigned_driver_id, db)
    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return get_vehicle_by_id(vehicle.id, db)


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
    if "assigned_driver_id" in changes and changes["assigned_driver_id"] is not None:
        _check_driver(changes["assigned_driver_id"], db)
    for field, value in changes.items():
        setattr(vehicle, field, value)
    db.commit()
    return get_vehicle_by_id(vehicle_id, db)


def delete_vehicle(vehicle_id: int, db: Session) -> None:
    vehicle = get_vehicle_by_id(vehicle_id, db)
    db.delete(vehicle)
    db.commit()
