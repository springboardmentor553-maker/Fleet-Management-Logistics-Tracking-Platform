from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.common import MessageResponse

from app.dependencies import (
    get_db,
    require_role,
)

from app.models.user import User
from app.models.driver import Driver
from app.models.trip import Trip

from app.schemas.driver import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
    DriverPerformanceResponse,
)

router = APIRouter()


# -----------------------------
# Add Driver
# Admin Only
# -----------------------------
@router.post("/", response_model=DriverResponse)
def add_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    existing_driver = db.query(Driver).filter(
        Driver.license_number == driver.license_number
    ).first()

    if existing_driver:
        raise HTTPException(
            status_code=400,
            detail="Driver already exists."
        )

    new_driver = Driver(
        name=driver.name,
        phone=driver.phone,
        license_number=driver.license_number,
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return new_driver


# -----------------------------
# View All Drivers
# Admin + Fleet Manager + Dispatcher
# -----------------------------
@router.get("/", response_model=list[DriverResponse])
def get_all_drivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
        )
    )
):
    return db.query(Driver).all()


# -----------------------------
# View Single Driver
# Admin + Fleet Manager + Dispatcher + Driver
# -----------------------------
@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
            "driver",
        )
    )
):
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found."
        )

    return driver


# -----------------------------
# Update Driver
# Admin + Fleet Manager
# -----------------------------
@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: int,
    driver: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    )
):
    db_driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not db_driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found."
        )

    update_data = driver.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_driver, key, value)

    db.commit()
    db.refresh(db_driver)

    return db_driver


# -----------------------------
# Delete Driver
# Admin Only
# -----------------------------
@router.delete("/{driver_id}", response_model=MessageResponse)
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    db_driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not db_driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found."
        )

    db.delete(db_driver)
    db.commit()

    return {
        "message": "Driver deleted successfully."
    }

# -----------------------------
# Driver Performance
# Admin + Fleet Manager + Dispatcher
# -----------------------------
@router.get(
    "/{driver_id}/performance",
    response_model=DriverPerformanceResponse
)
def driver_performance(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher"
        )
    )
):
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found."
        )

    trips = db.query(Trip).filter(
        Trip.driver_id == driver_id
    ).all()

    total_trips = len(trips)

    completed_trips = sum(
        trip.status.upper() == "COMPLETED"
        for trip in trips
    )

    active_trips = sum(
        trip.status.upper() in ["ONGOING", "IN_PROGRESS"]
        for trip in trips
    )

    cancelled_trips = sum(
        trip.status.upper() == "CANCELLED"
        for trip in trips
    )

    return {
        "driver_id": driver_id,
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_trips": active_trips,
        "cancelled_trips": cancelled_trips
    }