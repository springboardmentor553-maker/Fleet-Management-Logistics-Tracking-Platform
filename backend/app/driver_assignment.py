from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role

from app.models.driver_assignment import DriverAssignment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.user import User

from app.schemas.driver_assignment import (
    DriverAssignmentCreate,
    DriverAssignmentUpdate,
    DriverAssignmentResponse,
)

from app.schemas.common import MessageResponse


router = APIRouter()


# -----------------------------
# Assign Driver
# Admin + Fleet Manager
# -----------------------------
@router.post("/", response_model=DriverAssignmentResponse)
def assign_driver(
    assignment: DriverAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    ),
):
    driver = db.query(Driver).filter(
        Driver.id == assignment.driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found."
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == assignment.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    trip = db.query(Trip).filter(
        Trip.id == assignment.trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found."
        )

    # -----------------------------
    # Driver Availability Check
    # -----------------------------
    if driver.status.lower() != "available":
        raise HTTPException(
            status_code=400,
            detail="Driver is not available."
        )

    # -----------------------------
    # Vehicle Availability Check
    # -----------------------------
    if vehicle.status.lower() != "available":
            raise HTTPException(
                status_code=400,
                detail="Vehicle is not available."
            )
    
    active_vehicle = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.vehicle_id == assignment.vehicle_id,
        DriverAssignment.assignment_status == "ASSIGNED"
    ).first()

    if active_vehicle:
        raise HTTPException(
            status_code=400,
            detail="Vehicle is already assigned."
        )

    # -----------------------------
    # Create Assignment
    # -----------------------------
    new_assignment = DriverAssignment(
        driver_id=assignment.driver_id,
        vehicle_id=assignment.vehicle_id,
        trip_id=assignment.trip_id,
        assignment_status=assignment.assignment_status,
        remarks=assignment.remarks,
    )

    db.add(new_assignment)

    # -----------------------------
    # Update Driver Status
    # -----------------------------
    if assignment.assignment_status == "ASSIGNED":
        driver.status = "assigned"

    elif assignment.assignment_status in [
        "COMPLETED",
        "CANCELLED",
    ]:
        driver.status = "available"

    db.commit()
    db.refresh(new_assignment)

    return new_assignment


# -----------------------------
# View All Assignments
# -----------------------------
@router.get(
    "/",
    response_model=list[DriverAssignmentResponse]
)
def get_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
        )
    ),
):
    return db.query(DriverAssignment).all()


# -----------------------------
# View Single Assignment
# -----------------------------
@router.get(
    "/{assignment_id}",
    response_model=DriverAssignmentResponse
)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
        )
    ),
):
    assignment = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if assignment is None:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found."
        )

    return assignment


# -----------------------------
# Update Assignment
# -----------------------------
@router.put(
    "/{assignment_id}",
    response_model=DriverAssignmentResponse
)
def update_assignment(
    assignment_id: int,
    assignment: DriverAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    ),
):
    db_assignment = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if db_assignment is None:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found."
        )

    driver = db.query(Driver).filter(
        Driver.id == db_assignment.driver_id
    ).first()

    update_data = assignment.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            db_assignment,
            key,
            value
        )

    # -----------------------------
    # Automatically Update Driver Status
    # -----------------------------
    if driver:

        if db_assignment.assignment_status == "ASSIGNED":
            driver.status = "assigned"

        elif db_assignment.assignment_status in [
            "COMPLETED",
            "CANCELLED",
        ]:
            driver.status = "available"

    db.commit()
    db.refresh(db_assignment)

    return db_assignment


# -----------------------------
# Remove Assignment
# -----------------------------
@router.delete(
    "/{assignment_id}",
    response_model=MessageResponse
)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    assignment = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if assignment is None:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found."
        )

    # Get driver before deleting assignment
    driver = db.query(Driver).filter(
        Driver.id == assignment.driver_id
    ).first()

    # Make driver available again
    if driver:
        driver.status = "available"

    db.delete(assignment)
    db.commit()

    return {
        "message": "Driver assignment removed successfully."
    }