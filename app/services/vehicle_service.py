from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate

from app.services.notification_service import create_notification


# =====================================
# Create Vehicle
# =====================================

def create_vehicle(vehicle: VehicleCreate, db: Session):

    existing_vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.vehicle_number == vehicle.vehicle_number
        )
        .first()
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already exists."
        )

    new_vehicle = Vehicle(**vehicle.model_dump())

    db.add(new_vehicle)

    create_notification(
        db=db,
        title="New Vehicle Added",
        message=f"Vehicle '{vehicle.vehicle_number}' has been added successfully.",
        type="success"
    )

    db.commit()
    db.refresh(new_vehicle)

    return new_vehicle


# =====================================
# Get All Vehicles
# =====================================

def get_all_vehicles(db: Session):

    return db.query(Vehicle).all()


# =====================================
# Get Single Vehicle
# =====================================

def get_vehicle(vehicle_id: int, db: Session):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return vehicle


# =====================================
# Update Vehicle
# =====================================

def update_vehicle(
    vehicle_id: int,
    vehicle: VehicleUpdate,
    db: Session
):

    db_vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not db_vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    for key, value in vehicle.model_dump().items():
        setattr(db_vehicle, key, value)

    create_notification(
        db=db,
        title="Vehicle Updated",
        message=f"Vehicle '{db_vehicle.vehicle_number}' has been updated.",
        type="info"
    )

    db.commit()
    db.refresh(db_vehicle)

    return db_vehicle


# =====================================
# Delete Vehicle
# =====================================

def delete_vehicle(
    vehicle_id: int,
    db: Session
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    vehicle_number = vehicle.vehicle_number

    create_notification(
        db=db,
        title="Vehicle Deleted",
        message=f"Vehicle '{vehicle_number}' has been deleted.",
        type="warning"
    )

    db.delete(vehicle)

    db.commit()

    return {
        "message": "Vehicle deleted successfully"
    }