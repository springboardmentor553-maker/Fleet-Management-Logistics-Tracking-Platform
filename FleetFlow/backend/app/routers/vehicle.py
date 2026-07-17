from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.vehicle import (
    VehicleCreate,
    VehicleResponse,
)

from app.services.vehicle import (
    create_vehicle,
    get_vehicle,
    get_vehicles,
    update_vehicle,
    delete_vehicle,
)

from app.auth.oauth2 import (
    get_current_user,
    get_current_admin,
)


router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


@router.post("/", response_model=VehicleResponse)
def create_new_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return create_vehicle(db, vehicle)


@router.get("/", response_model=list[VehicleResponse])
def read_vehicles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return get_vehicles(db)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def read_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    vehicle = get_vehicle(
        db,
        vehicle_id
    )

    if vehicle is None:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_existing_vehicle(
    vehicle_id: int,
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    updated_vehicle = update_vehicle(
        db,
        vehicle_id,
        vehicle
    )

    if updated_vehicle is None:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return updated_vehicle


@router.delete("/{vehicle_id}")
def delete_existing_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    deleted_vehicle = delete_vehicle(
        db,
        vehicle_id
    )

    if deleted_vehicle is None:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return {
        "message": "Vehicle deleted successfully"
    }