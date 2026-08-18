from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.routers.crud import commit_or_409
from app.schemas.driver_assignments import (
    DriverAssignmentCreate,
    DriverAssignmentRead,
    DriverAssignmentUpdate,
)

router = APIRouter()


def get_or_404(db: Session, model, item_id: int, label: str):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found")
    return item


def validate_driver_and_vehicle_availability(
    db: Session, driver_id: int, vehicle_id: int, exclude_trip_id: int | None = None
):
    driver = get_or_404(db, models.Driver, driver_id, "Driver")
    vehicle = get_or_404(db, models.Vehicle, vehicle_id, "Vehicle")

    # Task 3: Check if driver is on leave
    if driver.status and driver.status.lower() in ["on leave", "leave", "on_leave"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver is on leave (current status: {driver.status})",
        )

    # Task 3: Check if vehicle is under maintenance
    if vehicle.status and vehicle.status.lower() in ["maintenance", "under maintenance", "under_maintenance", "in maintenance"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle is under maintenance (current status: {vehicle.status})",
        )

    # Task 3: Check if driver is already assigned to another active trip
    driver_active_trip_query = db.query(models.Trip).filter(
        models.Trip.driver_id == driver_id,
        models.Trip.status.in_(models.ACTIVE_TRIP_STATUSES),
    )
    if exclude_trip_id is not None:
        driver_active_trip_query = driver_active_trip_query.filter(models.Trip.id != exclude_trip_id)
    if driver_active_trip_query.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Driver is already assigned to another active trip",
        )

    # Task 3: Check if vehicle is already assigned to another active trip
    vehicle_active_trip_query = db.query(models.Trip).filter(
        models.Trip.vehicle_id == vehicle_id,
        models.Trip.status.in_(models.ACTIVE_TRIP_STATUSES),
    )
    if exclude_trip_id is not None:
        vehicle_active_trip_query = vehicle_active_trip_query.filter(models.Trip.id != exclude_trip_id)
    if vehicle_active_trip_query.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle is already assigned to another active trip",
        )

    return driver, vehicle


@router.post("/", response_model=DriverAssignmentRead, status_code=status.HTTP_201_CREATED)
def assign_driver(payload: DriverAssignmentCreate, db: Session = Depends(get_db)):
    """Assign Driver (Task 3 & 4)"""
    get_or_404(db, models.Trip, payload.trip_id, "Trip")
    driver, vehicle = validate_driver_and_vehicle_availability(
        db, payload.driver_id, payload.vehicle_id, exclude_trip_id=payload.trip_id
    )


    assignment = models.DriverAssignment(**payload.model_dump())
    db.add(assignment)

    # Update Driver Status to Assigned (Task 4)
    driver.status = "Assigned"

    commit_or_409(db)
    db.refresh(assignment)
    return assignment



@router.get("/", response_model=list[DriverAssignmentRead])
def list_driver_assignments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """View Assigned Drivers (Task 3)"""
    return db.query(models.DriverAssignment).offset(skip).limit(limit).all()


@router.get("/{item_id}", response_model=DriverAssignmentRead)
def get_driver_assignment(item_id: int, db: Session = Depends(get_db)):
    """Get Driver Assignment by ID"""
    return get_or_404(db, models.DriverAssignment, item_id, "DriverAssignment")


@router.put("/{item_id}", response_model=DriverAssignmentRead)
def update_driver_assignment(
    item_id: int, payload: DriverAssignmentUpdate, db: Session = Depends(get_db)
):
    """Update Driver Assignment (Task 3 & 4)"""
    assignment = get_or_404(db, models.DriverAssignment, item_id, "DriverAssignment")
    data = payload.model_dump(exclude_unset=True)

    next_driver_id = data.get("driver_id", assignment.driver_id)
    next_vehicle_id = data.get("vehicle_id", assignment.vehicle_id)
    next_trip_id = data.get("trip_id", assignment.trip_id)

    get_or_404(db, models.Trip, next_trip_id, "Trip")
    driver, vehicle = validate_driver_and_vehicle_availability(
        db, next_driver_id, next_vehicle_id, exclude_trip_id=next_trip_id
    )

    for field, value in data.items():
        setattr(assignment, field, value)

    # Check if assignment status is Completed or Cancelled
    if assignment.assignment_status and assignment.assignment_status.lower() in ("completed", "cancelled"):
        driver.status = "available"
    else:
        driver.status = "Assigned"

    commit_or_409(db)
    db.refresh(assignment)
    return assignment


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_driver_assignment(item_id: int, db: Session = Depends(get_db)):
    """Remove Driver Assignment (Task 3 & 4)"""
    assignment = get_or_404(db, models.DriverAssignment, item_id, "DriverAssignment")
    driver = db.get(models.Driver, assignment.driver_id)
    if driver:
        driver.status = "available"
    db.delete(assignment)
    commit_or_409(db)
    return None
