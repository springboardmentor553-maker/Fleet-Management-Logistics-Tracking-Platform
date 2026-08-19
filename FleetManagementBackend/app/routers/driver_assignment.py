from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.driver_assignment import DriverAssignment
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.schemas.driver_assignment import (
    DriverAssignmentCreate,
    DriverAssignmentResponse,
    DriverAssignmentUpdate,
)

router = APIRouter(
    prefix="/driver-assignments",
    tags=["Driver Assignments"]
)
@router.post("/", response_model=DriverAssignmentResponse)
def assign_driver(
    assignment: DriverAssignmentCreate,
    db: Session = Depends(get_db)
):

    driver = db.query(Driver).filter(
        Driver.id == assignment.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == assignment.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    trip = db.query(Trip).filter(
        Trip.id == assignment.trip_id
    ).first()

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )
    if driver.status == "ON_LEAVE":
        raise HTTPException(
            status_code=400,
            detail="Driver is on leave and cannot be assigned."
        )


    if driver.status != "AVAILABLE":
        raise HTTPException(
            status_code=400,
            detail="Driver is not available"
            )
    if vehicle.status == "Under Maintenance":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is under maintenance and cannot be assigned."
            )
    if vehicle.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available"
            )

    active_driver = db.query(DriverAssignment).filter(
        DriverAssignment.driver_id == assignment.driver_id,
        DriverAssignment.assignment_status == "Assigned"
    ).first()

    if active_driver:
        raise HTTPException(
            status_code=400,
            detail="Driver is already assigned to another active trip"
        )

    active_vehicle = db.query(DriverAssignment).filter(
        DriverAssignment.vehicle_id == assignment.vehicle_id,
        DriverAssignment.assignment_status == "Assigned"
    ).first()

    if active_vehicle:
        raise HTTPException(
            status_code=400,
            detail="Vehicle is already assigned to another active trip"
        )

    new_assignment = DriverAssignment(
        **assignment.model_dump()
    )

    driver.status = "ASSIGNED"
    vehicle.status = "On Trip"

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment
@router.get("/", response_model=list[DriverAssignmentResponse])
def view_assignments(
    db: Session = Depends(get_db)
):
    return db.query(DriverAssignment).all()
@router.put("/{assignment_id}", response_model=DriverAssignmentResponse)
def update_assignment(
    assignment_id: int,
    update: DriverAssignmentUpdate,
    db: Session = Depends(get_db)
):
    assignment = db.query(DriverAssignment).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    update_data = update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(assignment, key, value)

    if assignment.assignment_status in ["Completed", "Cancelled"]:
        driver = db.query(Driver).filter(
            Driver.id == assignment.driver_id
            ).first()
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == assignment.vehicle_id
            ).first()
        if driver:
            driver.status = "AVAILABLE"
        if vehicle:
            vehicle.status = "Available"


    db.commit()
    db.refresh(assignment)

    return assignment
@router.delete("/{assignment_id}")
def remove_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    assignment = db.query(DriverAssignment).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    driver = db.query(Driver).filter(
        Driver.id == assignment.driver_id
    ).first()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == assignment.vehicle_id
    ).first()

    if driver:
        driver.status = "Available"

    if vehicle:
        vehicle.status = "Available"

    db.delete(assignment)
    db.commit()

    return {
        "message": "Driver assignment removed successfully"
    }