from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import Query
from app.database import get_db
from app.models.fuel import FuelLog
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.schemas.fuel import FuelCreate, FuelUpdate, FuelResponse
from typing import Optional
from app.logs.logger import logger
from app.utils.security import require_role
router = APIRouter(
    prefix="/fuel",
    tags=["Fuel Management"]
)


@router.post("/", response_model=FuelResponse)
def create_fuel_log(
    fuel: FuelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == fuel.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )
    driver = db.query(Driver).filter(
        Driver.id == fuel.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if fuel.fuel_quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel quantity must be greater than 0"
        )

    if fuel.fuel_cost <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel cost must be greater than 0"
        )

    if fuel.odometer_reading < 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid odometer reading"
        )

    new_log = FuelLog(**fuel.model_dump())

    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    logger.info(
        f"Fuel Added | Vehicle={fuel.vehicle_id} | Cost={fuel.fuel_cost}"
        )

    return new_log


@router.get("/")
def get_fuel_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    fuel_station: Optional[str] = None,
    sort_by: str = "fuel_date",
    order: str = "desc",
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):
    query = db.query(FuelLog)

    # =====================
    # Filtering
    # =====================
    if fuel_station:
        query = query.filter(
            FuelLog.fuel_station.ilike(f"%{fuel_station}%")
        )

    # =====================
    # Sorting
    # =====================
    if sort_by == "fuel_date":
        query = query.order_by(
            FuelLog.fuel_date.desc()
            if order.lower() == "desc"
            else FuelLog.fuel_date.asc()
        )

    elif sort_by == "fuel_cost":
        query = query.order_by(
            FuelLog.fuel_cost.desc()
            if order.lower() == "desc"
            else FuelLog.fuel_cost.asc()
        )

    elif sort_by == "fuel_quantity":
        query = query.order_by(
            FuelLog.fuel_quantity.desc()
            if order.lower() == "desc"
            else FuelLog.fuel_quantity.asc()
        )

    elif sort_by == "odometer_reading":
        query = query.order_by(
            FuelLog.odometer_reading.desc()
            if order.lower() == "desc"
            else FuelLog.odometer_reading.asc()
        )

    elif sort_by == "created_at":
        query = query.order_by(
            FuelLog.created_at.desc()
            if order.lower() == "desc"
            else FuelLog.created_at.asc()
        )

    # =====================
    # Pagination
    # =====================
    fuel_logs = (
        query
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    logger.info(
        f"Fuel Logs Viewed | Page={page}"
        )

    return fuel_logs

@router.get("/search/", response_model=list[FuelResponse])
def search_fuel_logs(
    fuel_station: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):

    fuel_logs = db.query(FuelLog).filter(
        FuelLog.fuel_station.ilike(f"%{fuel_station}%")
    ).all()

    logger.info(
        f"Fuel Search | Station={fuel_station}"
    )

    return fuel_logs


@router.get("/{fuel_id}", response_model=FuelResponse)
def get_fuel_log(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):

    fuel = db.query(FuelLog).filter(
        FuelLog.id == fuel_id,
        FuelLog.is_active == 1
    ).first()

    if not fuel:

        logger.warning(
            f"Fuel Log Not Found | ID={fuel_id}"
        )

        raise HTTPException(
            status_code=404,
            detail="Fuel log not found"
        )

    logger.info(
        f"Fuel Log Viewed | ID={fuel.id}"
    )

    return fuel


@router.put("/{fuel_id}", response_model=FuelResponse)
def update_fuel_log(
    fuel_id: int,
    updated: FuelUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):

    fuel = db.query(FuelLog).filter(
        FuelLog.id == fuel_id,
        FuelLog.is_active == 1
    ).first()

    if not fuel:

        logger.warning(
            f"Fuel Update Failed | ID={fuel_id}"
        )

        raise HTTPException(
            status_code=404,
            detail="Fuel log not found"
        )

    update_data = updated.model_dump(exclude_unset=True)

    # Validate vehicle
    if "vehicle_id" in update_data:

        vehicle = db.query(Vehicle).filter(
            Vehicle.id == update_data["vehicle_id"]
        ).first()

        if not vehicle:
            raise HTTPException(
                status_code=404,
                detail="Vehicle not found"
            )

    # Validate driver
    if "driver_id" in update_data:

        driver = db.query(Driver).filter(
            Driver.id == update_data["driver_id"]
        ).first()

        if not driver:
            raise HTTPException(
                status_code=404,
                detail="Driver not found"
            )

    # Validate fuel quantity
    if (
        "fuel_quantity" in update_data
        and update_data["fuel_quantity"] <= 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Fuel quantity must be greater than 0"
        )

    # Validate fuel cost
    if (
        "fuel_cost" in update_data
        and update_data["fuel_cost"] <= 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Fuel cost must be greater than 0"
        )

    # Validate odometer
    if (
        "odometer_reading" in update_data
        and update_data["odometer_reading"] < 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid odometer reading"
        )

    # Update fields
    for key, value in update_data.items():
        setattr(fuel, key, value)

    db.commit()
    db.refresh(fuel)

    logger.info(
        f"Fuel Log Updated | ID={fuel.id}"
    )

    return fuel

@router.delete("/{fuel_id}")
def delete_fuel_log(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager"]))
):

    fuel = db.query(FuelLog).filter(
        FuelLog.id == fuel_id
    ).first()

    if not fuel:

        logger.warning(
            f"Fuel Delete Failed | ID={fuel_id}"
        )

        raise HTTPException(
            status_code=404,
            detail="Fuel log not found"
        )

    fuel.is_active = 0

    db.commit()

    logger.info(
        f"Fuel Log Archived | ID={fuel.id}"
    )

    return {
        "message": "Fuel log archived successfully"
    }