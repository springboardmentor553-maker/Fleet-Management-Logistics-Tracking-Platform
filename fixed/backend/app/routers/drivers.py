from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.routers.crud import build_crud_router
from app.schemas.driver_performance import DriverPerformanceRead
from app.schemas.drivers import DriverCreate, DriverRead, DriverUpdate

router = build_crud_router(
    model=models.Driver,
    create_schema=DriverCreate,
    update_schema=DriverUpdate,
    read_schema=DriverRead,
)

# Task 5 specifies GET /driver/{driver_id}/performance (singular path)
performance_router = APIRouter()


def get_driver_performance_data(driver_id: int, db: Session) -> DriverPerformanceRead:
    driver = db.get(models.Driver, driver_id)
    if driver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found",
        )

    trips = db.query(models.Trip).filter(models.Trip.driver_id == driver_id).all()

    total_trips = len(trips)
    completed_trips = sum(1 for t in trips if t.status == models.TripStatus.COMPLETED)
    active_trips = sum(1 for t in trips if t.status in models.ACTIVE_TRIP_STATUSES)
    cancelled_trips = sum(1 for t in trips if t.status == models.TripStatus.CANCELLED)

    return DriverPerformanceRead(
        driver_id=driver_id,
        total_trips=total_trips,
        completed_trips=completed_trips,
        active_trips=active_trips,
        cancelled_trips=cancelled_trips,
    )


@router.get("/{driver_id}/performance", response_model=DriverPerformanceRead)
def get_driver_performance(driver_id: int, db: Session = Depends(get_db)):
    """Task 5: Driver Performance API (plural /drivers/{driver_id}/performance)"""
    return get_driver_performance_data(driver_id, db)


@performance_router.get("/driver/{driver_id}/performance", response_model=DriverPerformanceRead)
def get_driver_performance_singular(driver_id: int, db: Session = Depends(get_db)):
    """Task 5: Driver Performance API (singular /driver/{driver_id}/performance)"""
    return get_driver_performance_data(driver_id, db)
