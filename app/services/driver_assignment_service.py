from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.driver_assignment import DriverAssignment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.schemas.driver_assignment import DriverAssignmentCreate, DriverAssignmentUpdate

from app.services.notification_service import create_notification


ACTIVE_ASSIGNMENT_STATUSES = ["Active"]


# =====================================
# Assign Driver
# =====================================

def assign_driver(assignment: DriverAssignmentCreate, db: Session):

    driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    vehicle = db.query(Vehicle).filter(Vehicle.id == assignment.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    trip = db.query(Trip).filter(Trip.id == assignment.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if driver.status == "On Leave":
        raise HTTPException(status_code=400, detail="Driver is on leave and cannot             be assigned")

    if driver.status != "Available":
        raise HTTPException(status_code=400, detail="Driver is not available")
    if vehicle.status != "Available":
        raise HTTPException(status_code=400, detail="Vehicle is not available")

    active_driver_assignment = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.driver_id == assignment.driver_id,
            DriverAssignment.assignment_status.in_(ACTIVE_ASSIGNMENT_STATUSES)
        )
        .first()
    )
    if active_driver_assignment:
        raise HTTPException(status_code=400, detail="Driver is already assigned to an active trip")

    active_vehicle_assignment = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.vehicle_id == assignment.vehicle_id,
            DriverAssignment.assignment_status.in_(ACTIVE_ASSIGNMENT_STATUSES)
        )
        .first()
    )
    if active_vehicle_assignment:
        raise HTTPException(status_code=400, detail="Vehicle is already assigned to an active trip")

    new_assignment = DriverAssignment(**assignment.model_dump())

    db.add(new_assignment)

    # Task 4 — Automatic Driver Status Update
    driver.status = "Assigned"

    create_notification(
        db=db,
        title="Driver Assigned",
        message=f"Driver '{driver.name}' assigned to trip #{assignment.trip_id}.",
        type="success"
    )

    db.commit()
    db.refresh(new_assignment)

    return new_assignment


# =====================================
# View Assigned Drivers
# =====================================

def get_all_assignments(db: Session):
    return db.query(DriverAssignment).all()


def get_assignment(assignment_id: int, db: Session):
    assignment = db.query(DriverAssignment).filter(DriverAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


# =====================================
# Update Driver Assignment
# =====================================

def update_assignment(assignment_id: int, assignment: DriverAssignmentUpdate, db: Session):

    db_assignment = db.query(DriverAssignment).filter(DriverAssignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    for key, value in assignment.model_dump().items():
        setattr(db_assignment, key, value)

    # Task 4 — release driver back to Available if assignment ends
    if assignment.assignment_status.lower() in ["completed", "cancelled"]:
        driver = db.query(Driver).filter(Driver.id == db_assignment.driver_id).first()
        if driver:
            driver.status = "Available"

    create_notification(
        db=db,
        title="Driver Assignment Updated",
        message=f"Assignment #{assignment_id} updated to '{assignment.assignment_status}'.",
        type="info"
    )

    db.commit()
    db.refresh(db_assignment)

    return db_assignment


# =====================================
# Remove Driver Assignment
# =====================================

def remove_assignment(assignment_id: int, db: Session):

    assignment = db.query(DriverAssignment).filter(DriverAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
    if driver:
        driver.status = "Available"

    create_notification(
        db=db,
        title="Driver Assignment Removed",
        message=f"Assignment #{assignment_id} has been removed.",
        type="warning"
    )

    db.delete(assignment)
    db.commit()

    return {"message": "Driver assignment removed successfully"}