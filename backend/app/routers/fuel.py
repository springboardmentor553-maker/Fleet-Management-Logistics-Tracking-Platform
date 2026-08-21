from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db

from app.models.fuel import Fuel
from app.models.vehicle import Vehicle

from app.schemas.fuel import (
    FuelCreate,
    FuelUpdate,
    FuelResponse
)

from app.utils.audit import create_audit_log
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/fuel",
    tags=["Fuel"]
)


# =====================================================
# CREATE FUEL RECORD
# =====================================================

@router.post(
    "/",
    response_model=FuelResponse
)
def create_fuel_record(
    fuel: FuelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -------------------------------------------------
    # CHECK VEHICLE
    # -------------------------------------------------

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == fuel.vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # -------------------------------------------------
    # CREATE FUEL RECORD
    # -------------------------------------------------

    new_record = Fuel(
        vehicle_id=fuel.vehicle_id,
        fuel_date=fuel.fuel_date,
        liters=fuel.liters,
        cost=fuel.cost,
        odometer=fuel.odometer,
        fuel_station=fuel.fuel_station
    )

    db.add(new_record)

    # Generate ID
    db.flush()

    # -------------------------------------------------
    # AUDIT LOG
    # -------------------------------------------------

    create_audit_log(
        db=db,
        user=current_user,
        module="Fuel",
        action="CREATE",
        details=(
            f"Fuel record ID {new_record.id} "
            f"was created for Vehicle ID "
            f"{new_record.vehicle_id}. "
            f"Liters: {new_record.liters}, "
            f"Cost: {new_record.cost}."
        )
    )

    # -------------------------------------------------
    # COMMIT
    # -------------------------------------------------

    db.commit()

    db.refresh(new_record)

    return new_record


# =====================================================
# GET ALL FUEL RECORDS
# =====================================================

@router.get(
    "/",
    response_model=list[FuelResponse]
)
def get_fuel_records(
    db: Session = Depends(get_db)
):

    return (
        db.query(Fuel)
        .order_by(Fuel.id.desc())
        .all()
    )


# =====================================================
# OVERALL FUEL ANALYTICS
# =====================================================

@router.get("/analytics")
def fuel_analytics(
    db: Session = Depends(get_db)
):

    total_records = (
        db.query(Fuel)
        .count()
    )

    total_liters = (
        db.query(
            func.sum(Fuel.liters)
        )
        .scalar()
        or 0
    )

    total_cost = (
        db.query(
            func.sum(Fuel.cost)
        )
        .scalar()
        or 0
    )

    average_bill = (
        db.query(
            func.avg(Fuel.cost)
        )
        .scalar()
        or 0
    )

    highest_bill = (
        db.query(
            func.max(Fuel.cost)
        )
        .scalar()
        or 0
    )

    lowest_bill = (
        db.query(
            func.min(Fuel.cost)
        )
        .scalar()
        or 0
    )

    return {

        "total_records": total_records,

        "total_fuel_consumed": round(
            float(total_liters),
            2
        ),

        "total_fuel_cost": round(
            float(total_cost),
            2
        ),

        "average_fuel_bill": round(
            float(average_bill),
            2
        ),

        "highest_fuel_bill": round(
            float(highest_bill),
            2
        ),

        "lowest_fuel_bill": round(
            float(lowest_bill),
            2
        )
    }


# =====================================================
# VEHICLE FUEL ANALYTICS
# =====================================================

@router.get("/vehicle/{vehicle_id}")
def vehicle_fuel_analytics(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    # -------------------------------------------------
    # CHECK VEHICLE
    # -------------------------------------------------

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

    # -------------------------------------------------
    # GET RECORDS
    # -------------------------------------------------

    records = (
        db.query(Fuel)
        .filter(
            Fuel.vehicle_id == vehicle_id
        )
        .all()
    )

    # -------------------------------------------------
    # NO RECORDS
    # -------------------------------------------------

    if not records:

        return {
            "vehicle_id": vehicle_id,
            "total_records": 0,
            "total_liters": 0,
            "total_cost": 0,
            "average_bill": 0
        }

    # -------------------------------------------------
    # CALCULATE TOTALS
    # -------------------------------------------------

    total_liters = sum(
        record.liters
        for record in records
    )

    total_cost = sum(
        record.cost
        for record in records
    )

    average_cost = (
        total_cost / len(records)
    )

    return {

        "vehicle_id": vehicle_id,

        "total_records": len(records),

        "total_liters": round(
            total_liters,
            2
        ),

        "total_cost": round(
            total_cost,
            2
        ),

        "average_bill": round(
            average_cost,
            2
        )
    }


# =====================================================
# GET FUEL RECORD BY ID
# =====================================================

@router.get(
    "/{fuel_id}",
    response_model=FuelResponse
)
def get_fuel_record(
    fuel_id: int,
    db: Session = Depends(get_db)
):

    record = (
        db.query(Fuel)
        .filter(
            Fuel.id == fuel_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    return record


# =====================================================
# UPDATE FUEL RECORD
# =====================================================

@router.put(
    "/{fuel_id}",
    response_model=FuelResponse
)
def update_fuel_record(
    fuel_id: int,
    updated: FuelUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -------------------------------------------------
    # FIND RECORD
    # -------------------------------------------------

    record = (
        db.query(Fuel)
        .filter(
            Fuel.id == fuel_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    # -------------------------------------------------
    # CHECK VEHICLE IF CHANGED
    # -------------------------------------------------

    if updated.vehicle_id is not None:

        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id == updated.vehicle_id
            )
            .first()
        )

        if not vehicle:
            raise HTTPException(
                status_code=404,
                detail="Vehicle not found"
            )

    # -------------------------------------------------
    # UPDATE FIELDS
    # -------------------------------------------------

    values = updated.model_dump(
        exclude_unset=True
    )

    for key, value in values.items():

        setattr(
            record,
            key,
            value
        )

    # -------------------------------------------------
    # AUDIT LOG
    # -------------------------------------------------

    create_audit_log(
        db=db,
        user=current_user,
        module="Fuel",
        action="UPDATE",
        details=(
            f"Fuel record ID {record.id} "
            f"for Vehicle ID {record.vehicle_id} "
            f"was updated."
        )
    )

    # -------------------------------------------------
    # COMMIT
    # -------------------------------------------------

    db.commit()

    db.refresh(record)

    return record


# =====================================================
# DELETE FUEL RECORD
# =====================================================

@router.delete("/{fuel_id}")
def delete_fuel_record(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -------------------------------------------------
    # FIND RECORD
    # -------------------------------------------------

    record = (
        db.query(Fuel)
        .filter(
            Fuel.id == fuel_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    fuel_id_value = record.id
    vehicle_id = record.vehicle_id

    # -------------------------------------------------
    # AUDIT LOG
    # -------------------------------------------------

    create_audit_log(
        db=db,
        user=current_user,
        module="Fuel",
        action="DELETE",
        details=(
            f"Fuel record ID {fuel_id_value} "
            f"for Vehicle ID {vehicle_id} "
            f"was deleted."
        )
    )

    # -------------------------------------------------
    # DELETE
    # -------------------------------------------------

    db.delete(record)

    db.commit()

    return {
        "message": "Fuel record deleted successfully"
    }