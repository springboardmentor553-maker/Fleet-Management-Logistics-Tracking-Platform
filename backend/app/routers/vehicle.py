from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Vehicle

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)

location_db = {}


@router.post("/")
def create_vehicle(
    vehicle_number: str,
    vehicle_type: str,
    capacity: float,
    fuel_type: str,
    fuel_level: float,
    fuel_status: str
):
    db = SessionLocal()

    vehicle = Vehicle(
        vehicle_number=vehicle_number,
        vehicle_type=vehicle_type,
        capacity=capacity,
        fuel_type=fuel_type,
        fuel_level=fuel_level,
        fuel_status=fuel_status
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle added successfully",
        "vehicle": vehicle
    }


@router.get("/")
def get_vehicles():
    db = SessionLocal()

    vehicles = db.query(Vehicle).all()

    return vehicles


@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle_number: str,
    vehicle_type: str,
    capacity: float,
    fuel_type: str,
    fuel_level: float,
    fuel_status: str
):
    db = SessionLocal()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    vehicle.vehicle_number = vehicle_number
    vehicle.vehicle_type = vehicle_type
    vehicle.capacity = capacity
    vehicle.fuel_type = fuel_type
    vehicle.fuel_level = fuel_level
    vehicle.fuel_status = fuel_status

    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle updated successfully",
        "vehicle": vehicle
    }


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int):
    db = SessionLocal()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    db.delete(vehicle)
    db.commit()

    return {
        "message": "Vehicle deleted successfully"
    }


@router.put("/{vehicle_id}/fuel")
def update_fuel(vehicle_id: int, fuel_level: float):
    db = SessionLocal()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    vehicle.fuel_level = fuel_level

    if fuel_level < 20:
        vehicle.fuel_status = "Low Fuel"
    else:
        vehicle.fuel_status = "Sufficient"

    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Fuel level updated successfully",
        "vehicle": vehicle
    }


@router.get("/{vehicle_id}/fuel")
def get_fuel(vehicle_id: int):
    db = SessionLocal()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    return {
        "vehicle_id": vehicle.id,
        "fuel_level": vehicle.fuel_level,
        "fuel_status": vehicle.fuel_status
    }


@router.get("/{vehicle_id}/fuel-alert")
def fuel_alert(vehicle_id: int):
    db = SessionLocal()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}

    if vehicle.fuel_level < 20:
        return {
            "alert": "⚠️ Low Fuel",
            "fuel_level": vehicle.fuel_level
        }

    return {
        "message": "Fuel level is sufficient",
        "fuel_level": vehicle.fuel_level
    }


@router.put("/{vehicle_id}/location")
def update_location(vehicle_id: int, latitude: float, longitude: float):
    location_db[vehicle_id] = {
        "latitude": latitude,
        "longitude": longitude
    }

    return {
        "message": "Vehicle location updated successfully",
        "vehicle_id": vehicle_id,
        "location": location_db[vehicle_id]
    }


@router.get("/{vehicle_id}/location")
def get_location(vehicle_id: int):
    if vehicle_id not in location_db:
        return {"message": "Vehicle not found"}

    return {
        "vehicle_id": vehicle_id,
        "location": location_db[vehicle_id]
    }