from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleResponse

from app.utils.audit import create_audit_log
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


# =====================================================
# CREATE VEHICLE
# =====================================================

@router.post(
    "/",
    response_model=VehicleResponse
)
def create_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    existing = (
        db.query(Vehicle)
        .filter(
            Vehicle.vehicle_number == vehicle.vehicle_number
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already exists"
        )

    new_vehicle = Vehicle(
        vehicle_number=vehicle.vehicle_number,
        vehicle_type=vehicle.vehicle_type,
        capacity=vehicle.capacity,
        status=vehicle.status
    )

    db.add(new_vehicle)

    # Generate ID before creating audit log
    db.flush()

    create_audit_log(
        db=db,
        user=current_user,
        module="Vehicle",
        action="CREATE",
        details=(
            f"Vehicle {new_vehicle.vehicle_number} "
            f"(ID: {new_vehicle.id}) was created."
        )
    )

    db.commit()
    db.refresh(new_vehicle)

    return new_vehicle


# =====================================================
# GET ALL VEHICLES
# =====================================================

@router.get(
    "/",
    response_model=list[VehicleResponse]
)
def get_all_vehicles(
    db: Session = Depends(get_db)
):

    return (
        db.query(Vehicle)
        .all()
    )


# =====================================================
# GET VEHICLE BY ID
# =====================================================

@router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse
)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return vehicle


# =====================================================
# UPDATE VEHICLE
# =====================================================

@router.put(
    "/{vehicle_id}",
    response_model=VehicleResponse
)
def update_vehicle(
    vehicle_id: int,
    updated_vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    old_vehicle_number = vehicle.vehicle_number
    old_status = vehicle.status

    vehicle.vehicle_number = updated_vehicle.vehicle_number
    vehicle.vehicle_type = updated_vehicle.vehicle_type
    vehicle.capacity = updated_vehicle.capacity
    vehicle.status = updated_vehicle.status

    create_audit_log(
        db=db,
        user=current_user,
        module="Vehicle",
        action="UPDATE",
        details=(
            f"Vehicle ID {vehicle.id} updated. "
            f"Vehicle number: {old_vehicle_number} -> "
            f"{vehicle.vehicle_number}. "
            f"Status: {old_status} -> "
            f"{vehicle.status}."
        )
    )

    db.commit()
    db.refresh(vehicle)

    return vehicle


# =====================================================
# DELETE VEHICLE
# =====================================================

@router.delete(
    "/{vehicle_id}"
)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    vehicle_number = vehicle.vehicle_number
    vehicle_id_value = vehicle.id

    # Audit BEFORE deleting vehicle
    create_audit_log(
        db=db,
        user=current_user,
        module="Vehicle",
        action="DELETE",
        details=(
            f"Vehicle {vehicle_number} "
            f"(ID: {vehicle_id_value}) was deleted."
        )
    )

    db.delete(vehicle)

    db.commit()

    return {
        "message": "Vehicle deleted successfully"
    }