<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Vehicle
from app.dependencies import (
    fleet_manager_required,
    vehicle_view_required,
    fuel_view_required
)

=======
from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Vehicle
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)

<<<<<<< HEAD

# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# CREATE VEHICLE
# Administrator / Fleet Manager
# ============================================================
=======
location_db = {}

>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

@router.post("/")
def create_vehicle(
    vehicle_number: str,
    vehicle_type: str,
<<<<<<< HEAD
    capacity: str,
    fuel_type: str,
    fuel_level: float,
    fuel_status: str,
    status: str,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    # Validate capacity
    try:
        capacity_value = float(capacity)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Capacity must be a valid number"
        )

    if capacity_value <= 0:
        raise HTTPException(
            status_code=400,
            detail="Capacity must be greater than zero"
        )

    # Validate fuel level
    if fuel_level < 0 or fuel_level > 100:
        raise HTTPException(
            status_code=400,
            detail="Fuel level must be between 0 and 100"
        )
=======
    capacity: float,
    fuel_type: str,
    fuel_level: float,
    fuel_status: str
):
    db = SessionLocal()
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

    vehicle = Vehicle(
        vehicle_number=vehicle_number,
        vehicle_type=vehicle_type,
        capacity=capacity,
        fuel_type=fuel_type,
        fuel_level=fuel_level,
<<<<<<< HEAD
        fuel_status=fuel_status,
        status=status
=======
        fuel_status=fuel_status
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle added successfully",
        "vehicle": vehicle
    }


<<<<<<< HEAD
# ============================================================
# GET ALL VEHICLES
# ============================================================

@router.get("/")
def get_vehicles(
    user=Depends(vehicle_view_required),
    db: Session = Depends(get_db)
):

    return db.query(Vehicle).all()


# ============================================================
# GET VEHICLE BY ID
# ============================================================

@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    user=Depends(vehicle_view_required),
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return vehicle


# ============================================================
# UPDATE VEHICLE
# Administrator / Fleet Manager
# ============================================================
=======
@router.get("/")
def get_vehicles():
    db = SessionLocal()

    vehicles = db.query(Vehicle).all()

    return vehicles

>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle_number: str,
    vehicle_type: str,
<<<<<<< HEAD
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
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Validate capacity
    try:
        capacity_value = float(capacity)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Capacity must be a valid number"
        )

    if capacity_value <= 0:
        raise HTTPException(
            status_code=400,
            detail="Capacity must be greater than zero"
        )

    # Validate fuel level
    if fuel_level < 0 or fuel_level > 100:
        raise HTTPException(
            status_code=400,
            detail="Fuel level must be between 0 and 100"
        )
=======
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
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

    vehicle.vehicle_number = vehicle_number
    vehicle.vehicle_type = vehicle_type
    vehicle.capacity = capacity
    vehicle.fuel_type = fuel_type
    vehicle.fuel_level = fuel_level
    vehicle.fuel_status = fuel_status
<<<<<<< HEAD
    vehicle.status = status
=======
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle updated successfully",
        "vehicle": vehicle
    }

<<<<<<< HEAD
# ============================================================
# DELETE VEHICLE
# Administrator / Fleet Manager
# ============================================================

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
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )
=======

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int):
    db = SessionLocal()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        return {"message": "Vehicle not found"}
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

    db.delete(vehicle)
    db.commit()

    return {
        "message": "Vehicle deleted successfully"
    }


<<<<<<< HEAD
# ============================================================
# UPDATE FUEL
# Administrator / Fleet Manager
# ============================================================

@router.put("/{vehicle_id}/fuel")
def update_fuel(
    vehicle_id: int,
    fuel_level: float,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Validate fuel level
    if fuel_level < 0 or fuel_level > 100:
        raise HTTPException(
            status_code=400,
            detail="Fuel level must be between 0 and 100"
        )

    # Update database
    vehicle.fuel_level = fuel_level

    # Automatically update fuel status
    if fuel_level < 20:
        vehicle.fuel_status = "low"
    else:
        vehicle.fuel_status = "good"
=======
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
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Fuel level updated successfully",
<<<<<<< HEAD
        "vehicle_id": vehicle.vehicle_id,
        "fuel_level": vehicle.fuel_level,
        "fuel_status": vehicle.fuel_status
    }


# ============================================================
# GET FUEL
# Administrator / Fleet Manager / Driver / Dispatcher
# ============================================================

@router.get("/{vehicle_id}/fuel")
def get_fuel(
    vehicle_id: int,
    user=Depends(fuel_view_required),
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return {
        "vehicle_id": vehicle.vehicle_id,
        "vehicle_number": vehicle.vehicle_number,
=======
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
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
        "fuel_level": vehicle.fuel_level,
        "fuel_status": vehicle.fuel_status
    }


<<<<<<< HEAD
# ============================================================
# FUEL ALERT
# Administrator / Fleet Manager / Driver / Dispatcher
# ============================================================

@router.get("/{vehicle_id}/fuel-alert")
def fuel_alert(
    vehicle_id: int,
    user=Depends(fuel_view_required),
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    fuel = vehicle.fuel_level

    # Low fuel
    if fuel < 20:
        return {
            "vehicle_id": vehicle.vehicle_id,
            "vehicle_number": vehicle.vehicle_number,
            "alert": "Low Fuel",
            "fuel_level": fuel,
            "fuel_status": vehicle.fuel_status
        }

    # Sufficient fuel
    return {
        "vehicle_id": vehicle.vehicle_id,
        "vehicle_number": vehicle.vehicle_number,
        "message": "Fuel level is sufficient",
        "fuel_level": fuel,
        "fuel_status": vehicle.fuel_status
    }


# ============================================================
# UPDATE LOCATION
# Administrator / Fleet Manager
# ============================================================

@router.put("/{vehicle_id}/location")
def update_location(
    vehicle_id: int,
    latitude: float,
    longitude: float,
    user=Depends(fleet_manager_required),
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Validate latitude
    if latitude < -90 or latitude > 90:
        raise HTTPException(
            status_code=400,
            detail="Latitude must be between -90 and 90"
        )

    # Validate longitude
    if longitude < -180 or longitude > 180:
        raise HTTPException(
            status_code=400,
            detail="Longitude must be between -180 and 180"
        )

    # Update database
    vehicle.latitude = latitude
    vehicle.longitude = longitude

    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle location updated successfully",
        "vehicle_id": vehicle.vehicle_id,
        "location": {
            "latitude": vehicle.latitude,
            "longitude": vehicle.longitude
        }
    }


# ============================================================
# GET LOCATION
# Administrator / Fleet Manager / Driver / Dispatcher
# ============================================================

@router.get("/{vehicle_id}/location")
def get_location(
    vehicle_id: int,
    user=Depends(vehicle_view_required),
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return {
        "vehicle_id": vehicle.vehicle_id,
        "vehicle_number": vehicle.vehicle_number,
        "latitude": vehicle.latitude,
        "longitude": vehicle.longitude
=======
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
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
    }