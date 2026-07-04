from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.post("/", response_model=VehicleResponse)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):

    existing = db.query(Vehicle).filter(
        Vehicle.vehicle_number == vehicle.vehicle_number
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Vehicle already exists")

    new_vehicle = Vehicle(
        vehicle_number=vehicle.vehicle_number,
        vehicle_type=vehicle.vehicle_type,
        capacity=vehicle.capacity,
        status=vehicle.status,
    )

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return new_vehicle

@router.get("/", response_model=list[VehicleResponse])
def get_all_vehicles(db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).all()
    return vehicles

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return vehicle
@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    updated_vehicle: VehicleCreate,
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    vehicle.vehicle_number = updated_vehicle.vehicle_number
    vehicle.vehicle_type = updated_vehicle.vehicle_type
    vehicle.capacity = updated_vehicle.capacity
    vehicle.status = updated_vehicle.status

    db.commit()
    db.refresh(vehicle)

    return vehicle
@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    db.delete(vehicle)
    db.commit()

    return {
        "message": "Vehicle deleted successfully"
    }