from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Driver, Trip

router = APIRouter(
    prefix="/driver",
    tags=["Driver Performance"]
)


@router.get("/{driver_id}/performance")
def driver_performance(driver_id: int, db: Session = Depends(get_db)):

    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    total_trips = db.query(Trip).filter(
        Trip.driver_id == driver_id
    ).count()

    completed_trips = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.trip_status == "Completed"
    ).count()

    active_trips = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.trip_status == "Active"
    ).count()

    cancelled_trips = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.trip_status == "Cancelled"
    ).count()

    return {
        "driver_id": driver.driver_id,
        "driver_name": driver.name,
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_trips": active_trips,
        "cancelled_trips": cancelled_trips
    }