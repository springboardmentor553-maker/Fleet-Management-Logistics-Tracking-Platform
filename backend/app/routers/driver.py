from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.driver import Driver
from backend.app.models.trip import Trip
from backend.app.schemas.driver import DriverCreate
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


@router.post("/")
def add_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"]))
):

    new_driver = Driver(
        name=driver.name,
        license_number=driver.license_number,
        phone=driver.phone
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return {
        "message": "Driver Added Successfully",
        "driver": new_driver
    }


@router.get("/")
def get_all_drivers(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):
    drivers = db.query(Driver).all()
    return drivers


@router.get("/{driver_id}/performance")
def get_driver_performance(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager", "Dispatcher"]))
):
    """Return performance metrics for a specific driver."""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    base_query = db.query(Trip).filter(Trip.driver_id == driver_id)

    total_trips = base_query.count()
    completed_trips = base_query.filter(Trip.status == "Completed").count()
    active_trips = base_query.filter(Trip.status == "Active").count()
    cancelled_trips = base_query.filter(Trip.status == "Cancelled").count()

    return {
        "driver_id": driver.id,
        "driver_name": driver.name,
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_trips": active_trips,
        "cancelled_trips": cancelled_trips,
    }