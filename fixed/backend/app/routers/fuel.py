from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas.fuel import FuelCreate, FuelRead, FuelUpdate

router = APIRouter()


@router.post("/", response_model=FuelRead, status_code=status.HTTP_201_CREATED)
def add_fuel_record(payload: FuelCreate, db: Session = Depends(get_db)):
    """Add a new Fuel Record with vehicle, driver, and numeric validations."""
    vehicle = db.get(models.Vehicle, payload.vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {payload.vehicle_id} does not exist.",
        )

    driver = db.get(models.Driver, payload.driver_id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver with ID {payload.driver_id} does not exist.",
        )

    qty = payload.fuel_quantity if payload.fuel_quantity is not None else payload.liters
    if qty is None or qty <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fuel quantity must be greater than zero.",
        )

    cost = payload.fuel_cost if payload.fuel_cost is not None else payload.total_cost
    if cost is None or cost <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fuel cost must be greater than zero.",
        )

    fdate = payload.fuel_date or payload.log_date

    fuel_entry = models.FuelRecord(
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        liters=qty,
        cost_per_liter=payload.cost_per_liter or (cost / qty if qty > 0 else None),
        total_cost=cost,
        odometer_reading=payload.odometer_reading,
        log_date=fdate,
        fuel_station=payload.fuel_station,
        remarks=payload.remarks,
    )
    db.add(fuel_entry)
    db.commit()
    db.refresh(fuel_entry)
    return fuel_entry


@router.get("/", response_model=List[FuelRead])
def view_all_fuel_records(
    vehicle_id: Optional[int] = Query(None),
    driver_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Retrieve fuel record history."""
    query = db.query(models.FuelRecord)
    if vehicle_id is not None:
        query = query.filter(models.FuelRecord.vehicle_id == vehicle_id)
    if driver_id is not None:
        query = query.filter(models.FuelRecord.driver_id == driver_id)
    return query.order_by(models.FuelRecord.log_date.desc()).offset(skip).limit(limit).all()


@router.get("/analytics")
def get_fuel_analytics_legacy(db: Session = Depends(get_db)):
    """Legacy fuel analytics endpoint."""
    total_liters = db.query(func.coalesce(func.sum(models.FuelRecord.liters), 0)).scalar() or 0
    total_cost = db.query(func.coalesce(func.sum(models.FuelRecord.total_cost), 0)).scalar() or 0
    avg_cost_per_liter = (total_cost / total_liters) if total_liters > 0 else 0

    vehicle_breakdown = (
        db.query(
            models.Vehicle.id,
            models.Vehicle.vehicle_number,
            func.coalesce(func.sum(models.FuelRecord.liters), 0).label("total_liters"),
            func.coalesce(func.sum(models.FuelRecord.total_cost), 0).label("total_cost"),
        )
        .join(models.FuelRecord, models.FuelRecord.vehicle_id == models.Vehicle.id, isouter=True)
        .group_by(models.Vehicle.id, models.Vehicle.vehicle_number)
        .all()
    )

    return {
        "total_liters": float(total_liters),
        "total_cost": float(total_cost),
        "avg_cost_per_liter": round(float(avg_cost_per_liter), 2),
        "vehicles": [
            {
                "vehicle_id": v[0],
                "vehicle_number": v[1],
                "total_liters": float(v[2]),
                "total_cost": float(v[3]),
            }
            for v in vehicle_breakdown
        ],
    }


@router.get("/{id}", response_model=FuelRead)
def get_fuel_record_by_id(id: int, db: Session = Depends(get_db)):
    """Get Fuel Record by ID."""
    record = db.get(models.FuelRecord, id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fuel record with ID {id} not found.",
        )
    return record


@router.put("/{id}", response_model=FuelRead)
@router.patch("/{id}", response_model=FuelRead)
def update_fuel_record(id: int, payload: FuelUpdate, db: Session = Depends(get_db)):
    """Update Fuel Record by ID."""
    record = db.get(models.FuelRecord, id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fuel record with ID {id} not found.",
        )

    if payload.vehicle_id is not None:
        vehicle = db.get(models.Vehicle, payload.vehicle_id)
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {payload.vehicle_id} does not exist.",
            )
        record.vehicle_id = payload.vehicle_id

    if payload.driver_id is not None:
        driver = db.get(models.Driver, payload.driver_id)
        if not driver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Driver with ID {payload.driver_id} does not exist.",
            )
        record.driver_id = payload.driver_id

    qty = payload.fuel_quantity if payload.fuel_quantity is not None else payload.liters
    if qty is not None:
        if qty <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fuel quantity must be greater than zero.",
            )
        record.liters = qty

    cost = payload.fuel_cost if payload.fuel_cost is not None else payload.total_cost
    if cost is not None:
        if cost <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fuel cost must be greater than zero.",
            )
        record.total_cost = cost

    if payload.cost_per_liter is not None:
        record.cost_per_liter = payload.cost_per_liter
    elif record.liters and record.liters > 0 and record.total_cost:
        record.cost_per_liter = record.total_cost / record.liters

    if payload.odometer_reading is not None:
        record.odometer_reading = payload.odometer_reading

    fdate = payload.fuel_date or payload.log_date
    if fdate is not None:
        record.log_date = fdate

    if payload.fuel_station is not None:
        record.fuel_station = payload.fuel_station

    if payload.remarks is not None:
        record.remarks = payload.remarks

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{id}")
def delete_fuel_record(id: int, db: Session = Depends(get_db)):
    """Delete Fuel Record by ID."""
    record = db.get(models.FuelRecord, id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fuel record with ID {id} not found.",
        )

    db.delete(record)
    db.commit()
    return {"message": f"Fuel record with ID {id} deleted successfully."}
