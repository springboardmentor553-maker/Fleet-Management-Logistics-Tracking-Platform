from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Vehicle

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])
fuel_db = {}
location_db={}

@router.post("/")
def create_vehicle(
    vehicle_number: str,
    vehicle_type: str,
    capacity: str,
    fuel_type: str,
    fuel_level: int,
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
    db.close()

    return {
        "message": "Vehicle added successfully",
        "vehicle": vehicle
    }


@router.get("/")
def get_vehicles():
    db = SessionLocal()
    vehicles = db.query(Vehicle).all()
    db.close()
    return vehicles


@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle_number: str,
    vehicle_type: str,
    capacity: str,
    fuel_type: str,
    fuel_level: int,
    fuel_status: str
):
    db = SessionLocal()

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if not vehicle:
        db.close()
        return {"message": "Vehicle not found"}

    vehicle.vehicle_number = vehicle_number
    vehicle.vehicle_type = vehicle_type
    vehicle.capacity = capacity
    vehicle.fuel_type = fuel_type
    vehicle.fuel_level = fuel_level
    vehicle.fuel_status = fuel_status

    db.commit()
    db.refresh(vehicle)
    db.close()

    return {
        "message": "Vehicle updated successfully",
        "vehicle": vehicle
    }


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int):
    db = SessionLocal()

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if not vehicle:
        db.close()
        return {"message": "Vehicle not found"}

    db.delete(vehicle)
    db.commit()
    db.close()

    return {"message": "Vehicle deleted successfully"}

@router.put("/{vehicle_id}/fuel")
def update_fuel(vehicle_id: int, fuel_level: float):
    fuel_db[vehicle_id] = fuel_level

    return {
        "message": "Fuel level updated successfully",
        "vehicle_id": vehicle_id,
        "fuel_level": fuel_level
    }

@router.get("/{vehicle_id}/fuel")
def get_fuel(vehicle_id: int):
    if vehicle_id not in fuel_db:
        return {"message": "Vehicle not found"}

    return {
        "vehicle_id": vehicle_id,
        "fuel_level": fuel_db[vehicle_id]
    }

@router.get("/{vehicle_id}/fuel-alert")
def fuel_alert(vehicle_id: int):
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