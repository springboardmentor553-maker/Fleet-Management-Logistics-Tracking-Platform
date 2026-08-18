from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db


router = APIRouter()


# =========================================================
# GET ALL VEHICLES
# =========================================================

@router.get("/")
def get_vehicles(db: Session = Depends(get_db)):
    vehicles = db.query(models.Vehicle).all()

    return [
        {
            "id": vehicle.id,
            "vehicle_number": vehicle.license_plate,
            "vehicle_type": vehicle.make,
            "model": vehicle.model,
            "capacity": vehicle.capacity_weight,
            "status": vehicle.status,
        }
        for vehicle in vehicles
    ]


# =========================================================
# GET SINGLE VEHICLE
# =========================================================

@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    vehicle = db.get(models.Vehicle, vehicle_id)

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return {
        "id": vehicle.id,
        "vehicle_number": vehicle.license_plate,
        "vehicle_type": vehicle.make,
        "model": vehicle.model,
        "capacity": vehicle.capacity_weight,
        "status": vehicle.status,
    }


# =========================================================
# CREATE VEHICLE
# =========================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: dict,
    db: Session = Depends(get_db),
):
    vehicle = models.Vehicle(
        license_plate=payload.get("vehicle_number"),
        make=payload.get("vehicle_type"),
        model=payload.get("model"),
        capacity_weight=payload.get("capacity"),
        status=payload.get("status", "active"),
        year=2026,
    )

    if not vehicle.license_plate:
        raise HTTPException(
            status_code=422,
            detail="Vehicle number is required",
        )

    if not vehicle.make:
        raise HTTPException(
            status_code=422,
            detail="Vehicle type is required",
        )

    if not vehicle.model:
        raise HTTPException(
            status_code=422,
            detail="Model is required",
        )

    if vehicle.capacity_weight is None:
        raise HTTPException(
            status_code=422,
            detail="Capacity is required",
        )

    db.add(vehicle)

    try:
        db.commit()
        db.refresh(vehicle)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Vehicle number already exists or database constraint failed",
        )

    return {
        "id": vehicle.id,
        "vehicle_number": vehicle.license_plate,
        "vehicle_type": vehicle.make,
        "model": vehicle.model,
        "capacity": vehicle.capacity_weight,
        "status": vehicle.status,
    }


# =========================================================
# UPDATE VEHICLE
# =========================================================

@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    vehicle = db.get(models.Vehicle, vehicle_id)

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    if "vehicle_number" in payload:
        vehicle.license_plate = payload["vehicle_number"]

    if "vehicle_type" in payload:
        vehicle.make = payload["vehicle_type"]

    if "model" in payload:
        vehicle.model = payload["model"]

    if "capacity" in payload:
        vehicle.capacity_weight = payload["capacity"]

    if "status" in payload:
        vehicle.status = payload["status"]

    try:
        db.commit()
        db.refresh(vehicle)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Vehicle update failed",
        )

    return {
        "id": vehicle.id,
        "vehicle_number": vehicle.license_plate,
        "vehicle_type": vehicle.make,
        "model": vehicle.model,
        "capacity": vehicle.capacity_weight,
        "status": vehicle.status,
    }


# =========================================================
# DELETE VEHICLE
# =========================================================

@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    vehicle = db.get(models.Vehicle, vehicle_id)

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    db.delete(vehicle)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Vehicle cannot be deleted",
        )

    return None