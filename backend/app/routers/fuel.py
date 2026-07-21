from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.fuel import Fuel
from app.models.vehicle import Vehicle
from app.schemas.fuel import FuelCreate, FuelUpdate, FuelResponse

router = APIRouter(
    prefix="/fuel",
    tags=["Fuel Management"]
)


# Create Fuel Record
@router.post("/", response_model=FuelResponse)
def create_fuel(
    fuel: FuelCreate,
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == fuel.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    new_fuel = Fuel(**fuel.model_dump())

    db.add(new_fuel)
    db.commit()
    db.refresh(new_fuel)

    return new_fuel


# Get All Fuel Records
@router.get("/", response_model=list[FuelResponse])
def get_all_fuel(
    db: Session = Depends(get_db)
):
    return db.query(Fuel).all()


# Get Fuel Record by ID
@router.get("/{fuel_id}", response_model=FuelResponse)
def get_fuel(
    fuel_id: int,
    db: Session = Depends(get_db)
):
    fuel = db.query(Fuel).filter(
        Fuel.id == fuel_id
    ).first()

    if not fuel:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    return fuel


# Update Fuel Record
@router.put("/{fuel_id}", response_model=FuelResponse)
def update_fuel(
    fuel_id: int,
    updated: FuelUpdate,
    db: Session = Depends(get_db)
):
    fuel = db.query(Fuel).filter(
        Fuel.id == fuel_id
    ).first()

    if not fuel:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    for key, value in updated.model_dump(exclude_unset=True).items():
        setattr(fuel, key, value)

    db.commit()
    db.refresh(fuel)

    return fuel


# Delete Fuel Record
@router.delete("/{fuel_id}")
def delete_fuel(
    fuel_id: int,
    db: Session = Depends(get_db)
):
    fuel = db.query(Fuel).filter(
        Fuel.id == fuel_id
    ).first()

    if not fuel:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    db.delete(fuel)
    db.commit()

    return {
        "message": "Fuel record deleted successfully"
    }


# Fuel History of a Vehicle
@router.get("/vehicle/{vehicle_id}", response_model=list[FuelResponse])
def vehicle_fuel_history(
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

    return db.query(Fuel).filter(
        Fuel.vehicle_id == vehicle_id
    ).all()


# Total Fuel Cost
@router.get("/vehicle/{vehicle_id}/total-cost")
def total_fuel_cost(
    vehicle_id: int,
    db: Session = Depends(get_db)
):
    total = db.query(
        func.sum(Fuel.cost)
    ).filter(
        Fuel.vehicle_id == vehicle_id
    ).scalar()

    return {
        "vehicle_id": vehicle_id,
        "total_cost": total or 0
    }


# Total Fuel Consumed
@router.get("/vehicle/{vehicle_id}/total-liters")
def total_fuel_liters(
    vehicle_id: int,
    db: Session = Depends(get_db)
):
    total = db.query(
        func.sum(Fuel.liters)
    ).filter(
        Fuel.vehicle_id == vehicle_id
    ).scalar()

    return {
        "vehicle_id": vehicle_id,
        "total_liters": total or 0
    }