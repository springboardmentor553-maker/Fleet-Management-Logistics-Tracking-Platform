from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DriverAssignment, Driver, Vehicle, Trip
from app.schemas.driver_assignment import (
    DriverAssignmentCreate,
    DriverAssignmentResponse
)

router = APIRouter(
    prefix="/driver-assignments",
    tags=["Driver Assignment"]
)


# Assign Driver
@router.post("/", response_model=DriverAssignmentResponse)
def assign_driver(assignment: DriverAssignmentCreate, db: Session = Depends(get_db)):

    driver = db.query(Driver).filter(
        Driver.driver_id == assignment.driver_id
    ).first()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == assignment.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    trip = db.query(Trip).filter(
        Trip.id == assignment.trip_id
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if vehicle.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available"
        )

    assignment_exists = db.query(DriverAssignment).filter(
        DriverAssignment.driver_id == assignment.driver_id,
        DriverAssignment.assignment_status == "Assigned"
    ).first()

    if assignment_exists:
        raise HTTPException(
            status_code=400,
            detail="Driver is already assigned"
        )

    new_assignment = DriverAssignment(
        driver_id=assignment.driver_id,
        vehicle_id=assignment.vehicle_id,
        trip_id=assignment.trip_id,
        assignment_status=assignment.assignment_status,
        remarks=assignment.remarks
    )
    driver.status = "Assigned"
    vehicle.status = "Assigned"

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment


# View Assigned Drivers
@router.get("/", response_model=list[DriverAssignmentResponse])
def get_assignments(db: Session = Depends(get_db)):
    return db.query(DriverAssignment).all()


# Update Driver Assignment
@router.put("/{assignment_id}", response_model=DriverAssignmentResponse)
def update_assignment(
    assignment_id: int,
    assignment: DriverAssignmentCreate,
    db: Session = Depends(get_db)
):

    record = db.query(DriverAssignment).filter(
        DriverAssignment.assignment_id == assignment_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Assignment not found")

    record.driver_id = assignment.driver_id
    record.vehicle_id = assignment.vehicle_id
    record.trip_id = assignment.trip_id
    record.assignment_status = assignment.assignment_status
    record.remarks = assignment.remarks

    db.commit()
    db.refresh(record)

    return record


# Remove Driver Assignment
@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):

    record = db.query(DriverAssignment).filter(
        DriverAssignment.assignment_id == assignment_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    # Update driver status
    driver = db.query(Driver).filter(
        Driver.driver_id == record.driver_id
    ).first()

    if driver:
        driver.status = "Available"

    # Update vehicle status
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == record.vehicle_id
    ).first()

    if vehicle:
        vehicle.status = "Available"

    db.delete(record)
    db.commit()

    return {"message": "Driver assignment removed successfully"}