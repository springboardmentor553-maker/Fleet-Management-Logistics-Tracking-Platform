from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.vehicle import Vehicle
from backend.app.schemas.vehicle import VehicleCreate, VehicleUpdate
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)
@router.post("/")
def add_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):

    new_vehicle = Vehicle(
        vehicle_number=vehicle.vehicle_number,
        vehicle_type=vehicle.vehicle_type,
        capacity=vehicle.capacity
    )

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return {
        "message": "Vehicle Added Successfully",
        "vehicle": new_vehicle
    }
@router.get("/")
def get_all_vehicles(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Driver", "Dispatcher"]))
):
    vehicles = db.query(Vehicle).all()

    return vehicles
@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle: VehicleUpdate,
    db: Session = Depends(get_db)
):
    db_vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not db_vehicle:
        return {
            "message": "Vehicle Not Found"
        }

    db_vehicle.vehicle_number = vehicle.vehicle_number
    db_vehicle.vehicle_type = vehicle.vehicle_type
    db_vehicle.capacity = vehicle.capacity
    db_vehicle.status = vehicle.status

    db.commit()
    db.refresh(db_vehicle)

    return {
        "message": "Vehicle Updated Successfully",
        "vehicle": db_vehicle
    }
@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        return {
            "message": "Vehicle Not Found"
        }

    db.delete(vehicle)
    db.commit()

    return {
        "message": "Vehicle Deleted Successfully"
    }
@router.patch("/{vehicle_id}/status")
def update_vehicle_status(
    vehicle_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        return {
            "message": "Vehicle Not Found"
        }

    vehicle.status = status

    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle Status Updated",
        "vehicle": vehicle
    }