from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.common import MessageResponse

from app.dependencies import (
    get_db,
    get_current_user,
    require_role
)
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    FleetSummary
)

router = APIRouter()


# -----------------------------
# Add Vehicle
# Admin Only
# -----------------------------
@router.post("/", response_model=VehicleResponse)
def add_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User =Depends(require_role("admin"))
):
    existing_vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_number == vehicle.vehicle_number
    ).first()

    if existing_vehicle:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already exists."
        )

    new_vehicle = Vehicle(
        vehicle_number=vehicle.vehicle_number,
        vehicle_type=vehicle.vehicle_type,
        capacity=vehicle.capacity,
        status=vehicle.status,
        fuel_type=vehicle.fuel_type,
        model=vehicle.model,
        manufacturer=vehicle.manufacturer
    )

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return new_vehicle


# -----------------------------
# View All Vehicles
# Admin + Fleet Manager + Dispatcher
# -----------------------------
@router.get("/", response_model=list[VehicleResponse])
def get_all_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher"
        )
    )
):
    return db.query(Vehicle).all()


# -----------------------------
# View Single Vehicle
# Admin + Fleet Manager + Dispatcher + Driver
# -----------------------------
@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
            "driver"
        )
    )
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    return vehicle


# -----------------------------
# Update Vehicle
# Admin + Fleet Manager
# -----------------------------
@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager"
        )
    )
):
    db_vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not db_vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    update_data = vehicle.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_vehicle, key, value)

    db.commit()
    db.refresh(db_vehicle)

    return db_vehicle


# -----------------------------
# Delete Vehicle
# Admin Only
# -----------------------------
@router.delete("/{vehicle_id}", response_model=MessageResponse)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    db_vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not db_vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    db.delete(db_vehicle)
    db.commit()

    return {
        "message": "Vehicle deleted successfully."
    }


# -----------------------------
# Fleet Summary
# Admin + Fleet Manager
# -----------------------------
@router.get("/summary/fleet", response_model=FleetSummary)
def fleet_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager"
        )
    )
):
    vehicles = db.query(Vehicle).all()

    total = len(vehicles)
    available = sum(v.status.lower() == "available" for v in vehicles)
    on_trip = sum(v.status.lower() == "on trip" for v in vehicles)
    maintenance = sum(v.status.lower() == "maintenance" for v in vehicles)
    inactive = sum(v.status.lower() == "inactive" for v in vehicles)

    return {
        "totalVehicles": total,
        "available": available,
        "onTrip": on_trip,
        "maintenance": maintenance,
        "inactive": inactive
    }