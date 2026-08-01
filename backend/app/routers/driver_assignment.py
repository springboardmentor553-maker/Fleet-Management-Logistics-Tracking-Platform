from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models.driver_assignment import DriverAssignment
from backend.app.models.driver import Driver
from backend.app.models.vehicle import Vehicle
from backend.app.models.trip import Trip
from backend.app.schemas.driver_assignment import (
    DriverAssignmentCreate,
    DriverAssignmentUpdate,
    DriverAssignmentResponse,
)
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/driver-assignments",
    tags=["Driver Assignments"],
)

ALLOWED_ROLES = ["Admin", "Fleet Manager", "Dispatcher"]


def _validate_entities(db: Session, driver_id: int, vehicle_id: int, trip_id: int):
    """Validate existence and availability of Driver, Vehicle, and Trip."""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    if driver.status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver '{driver.name}' is not available (current status: {driver.status})",
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    if vehicle.status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle '{vehicle.vehicle_number}' is not available (current status: {vehicle.status})",
        )

    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    return driver, vehicle, trip


# ── POST ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=DriverAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_driver_assignment(
    payload: DriverAssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(ALLOWED_ROLES)),
):
    """Assign a Driver to a Vehicle and Trip."""
    _validate_entities(db, payload.driver_id, payload.vehicle_id, payload.trip_id)

    assignment = DriverAssignment(
        driver_id=payload.driver_id,
        vehicle_id=payload.vehicle_id,
        trip_id=payload.trip_id,
        assignment_status=payload.assignment_status,
        remarks=payload.remarks,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Automatically mark driver as Assigned
    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
    driver.status = "Assigned"
    db.commit()

    return assignment


# ── GET ALL ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[DriverAssignmentResponse])
def get_all_driver_assignments(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(ALLOWED_ROLES)),
):
    """Return all driver assignments."""
    return db.query(DriverAssignment).all()


# ── GET ONE ───────────────────────────────────────────────────────────────────

@router.get("/{assignment_id}", response_model=DriverAssignmentResponse)
def get_driver_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(ALLOWED_ROLES)),
):
    """Return a single driver assignment."""
    record = db.query(DriverAssignment).filter(DriverAssignment.id == assignment_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return record


# ── PUT ───────────────────────────────────────────────────────────────────────

@router.put("/{assignment_id}", response_model=DriverAssignmentResponse)
def update_driver_assignment(
    assignment_id: int,
    payload: DriverAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(ALLOWED_ROLES)),
):
    """Update an existing driver assignment."""
    record = db.query(DriverAssignment).filter(DriverAssignment.id == assignment_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    # Resolve final FK values (use incoming or fall back to existing)
    new_driver_id = payload.driver_id if payload.driver_id is not None else record.driver_id
    new_vehicle_id = payload.vehicle_id if payload.vehicle_id is not None else record.vehicle_id
    new_trip_id = payload.trip_id if payload.trip_id is not None else record.trip_id

    # Re-validate only if any FK is changing
    if (
        new_driver_id != record.driver_id
        or new_vehicle_id != record.vehicle_id
        or new_trip_id != record.trip_id
    ):
        _validate_entities(db, new_driver_id, new_vehicle_id, new_trip_id)

    record.driver_id = new_driver_id
    record.vehicle_id = new_vehicle_id
    record.trip_id = new_trip_id

    if payload.assignment_status is not None:
        record.assignment_status = payload.assignment_status
    if payload.remarks is not None:
        record.remarks = payload.remarks

    db.commit()
    db.refresh(record)

    # Update Driver.status based on new assignment_status
    if payload.assignment_status in ("Completed", "Cancelled"):
        completed_driver = db.query(Driver).filter(Driver.id == record.driver_id).first()
        if completed_driver:
            completed_driver.status = "Available"
            db.commit()

    return record


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{assignment_id}", status_code=status.HTTP_200_OK)
def delete_driver_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["Admin", "Fleet Manager"])),
):
    """Remove a driver assignment."""
    record = db.query(DriverAssignment).filter(DriverAssignment.id == assignment_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    driver_id = record.driver_id
    db.delete(record)
    db.commit()

    # Restore driver to Available when assignment is removed
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver:
        driver.status = "Available"
        db.commit()

    return {"message": "Driver assignment deleted successfully"}
