from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Vehicle
from app.dependencies import fleet_manager_required

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)

fuel_db = {}
location_db = {}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create Vehicle
@router.post("/")
def create_vehicle(
    vehicle_number: str,
    vehicle_type: str,
    capacity: str,
    fuel_type: str,
    fuel_level: float,
    fuel_status: str,
    status: str,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    vehicle = Vehicle(
        vehicle_number=vehicle_number,
        vehicle_type=vehicle_type,
        capacity=capacity,
        fuel_type=fuel_type,
        fuel_level=fuel_level,
        fuel_status=fuel_status,
        status=status
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle added successfully",
        "vehicle": vehicle
    }


# Get All Vehicles
@router.get("/")
def get_vehicles(
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):
    return db.query(Vehicle).all()


# Get Vehicle By ID
@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    return vehicle


# Update Vehicle
@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle_number: str,
    vehicle_type: str,
    capacity: str,
    fuel_type: str,
    fuel_level: float,
    fuel_status: str,
    status: str,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    vehicle.vehicle_number = vehicle_number
    vehicle.vehicle_type = vehicle_type
    vehicle.capacity = capacity
    vehicle.fuel_type = fuel_type
    vehicle.fuel_level = fuel_level
    vehicle.fuel_status = fuel_status
    vehicle.status = status

    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle updated successfully",
        "vehicle": vehicle
    }


# Delete Vehicle
@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    db.delete(vehicle)
    db.commit()

    return {
        "message": "Vehicle deleted successfully"
    }


# Update Fuel
@router.put("/{vehicle_id}/fuel")
def update_fuel(
    vehicle_id: int,
    fuel_level: float,
    user=Depends(fleet_manager_required)
):
    fuel_db[vehicle_id] = fuel_level

    return {
        "message": "Fuel level updated successfully",
        "vehicle_id": vehicle_id,
        "fuel_level": fuel_level
    }


# Get Fuel
@router.get("/{vehicle_id}/fuel")
def get_fuel(
    vehicle_id: int,
    user=Depends(fleet_manager_required)
):

    if vehicle_id not in fuel_db:
        return {"message": "Vehicle not found"}

    return {
        "vehicle_id": vehicle_id,
        "fuel_level": fuel_db[vehicle_id]
    }


# Fuel Alert
@router.get("/{vehicle_id}/fuel-alert")
def fuel_alert(
    vehicle_id: int,
    user=Depends(fleet_manager_required)
):

    if vehicle_id not in fuel_db:
        return {"message": "Vehicle not found"}

    fuel = fuel_db[vehicle_id]

    if fuel < 20:
        return {
            "alert": "⚠️ Low Fuel",
            "fuel_level": fuel
        }

    return {
        "message": "Fuel level is sufficient",
        "fuel_level": fuel
    }


# Update Location
@router.put("/{vehicle_id}/location")
def update_location(
    vehicle_id: int,
    latitude: float,
    longitude: float,
    user=Depends(fleet_manager_required)
):

    location_db[vehicle_id] = {
        "latitude": latitude,
        "longitude": longitude
    }

    return {
        "message": "Vehicle location updated successfully",
        "vehicle_id": vehicle_id,
        "location": location_db[vehicle_id]
    }


# Get Location
@router.get("/{vehicle_id}/location")
def get_location(
    vehicle_id: int,
    user=Depends(fleet_manager_required)
):

    if vehicle_id not in location_db:
        return {"message": "Vehicle not found"}

    return {
        "vehicle_id": vehicle_id,
        "location": location_db[vehicle_id]
    }