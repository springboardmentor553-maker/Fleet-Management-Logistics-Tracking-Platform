from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DriverAssignment, Driver, Vehicle, Trip

from app.schemas.driver_assignment import (
    DriverAssignmentCreate,
    DriverAssignmentResponse
)

from app.dependencies import (
    fleet_operations_required,
    driver_view_required
)


router = APIRouter(
    prefix="/driver-assignments",
    tags=["Driver Assignment"]
)


# ============================================================
# ASSIGN DRIVER
# Administrator / Fleet Manager / Dispatcher
# ============================================================

@router.post(
    "/",
    response_model=DriverAssignmentResponse
)
def assign_driver(
    assignment: DriverAssignmentCreate,
    db: Session = Depends(get_db),
    user=Depends(fleet_operations_required)
):

    # --------------------------------------------------------
    # Validate Driver
    # --------------------------------------------------------

    driver = db.query(Driver).filter(
        Driver.driver_id == assignment.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # Driver must be available
    if driver.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Driver is not available"
        )

    # --------------------------------------------------------
    # Validate Vehicle
    # --------------------------------------------------------

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == assignment.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Vehicle must be available
    if vehicle.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available"
        )

    # --------------------------------------------------------
    # Validate Trip
    # --------------------------------------------------------

    trip = db.query(Trip).filter(
        Trip.id == assignment.trip_id
    ).first()

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    # --------------------------------------------------------
    # Check existing assignment
    # --------------------------------------------------------

    assignment_exists = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.driver_id == assignment.driver_id,
        DriverAssignment.assignment_status == "Assigned"
    ).first()

    if assignment_exists:
        raise HTTPException(
            status_code=400,
            detail="Driver is already assigned"
        )

    # --------------------------------------------------------
    # Create Assignment
    # --------------------------------------------------------

    new_assignment = DriverAssignment(
        driver_id=assignment.driver_id,
        vehicle_id=assignment.vehicle_id,
        trip_id=assignment.trip_id,
        assignment_status=assignment.assignment_status,
        remarks=assignment.remarks
    )

    # Update statuses
    driver.status = "Assigned"
    vehicle.status = "Assigned"

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment


# ============================================================
# VIEW ASSIGNED DRIVERS
# All allowed viewing roles including Driver
# ============================================================

@router.get(
    "/",
    response_model=list[DriverAssignmentResponse]
)
def get_assignments(
    db: Session = Depends(get_db),
    user=Depends(driver_view_required)
):

    return db.query(
        DriverAssignment
    ).all()


# ============================================================
# UPDATE DRIVER ASSIGNMENT
# Administrator / Fleet Manager / Dispatcher
# ============================================================

@router.put(
    "/{assignment_id}",
    response_model=DriverAssignmentResponse
)
def update_assignment(
    assignment_id: int,
    assignment: DriverAssignmentCreate,
    db: Session = Depends(get_db),
    user=Depends(fleet_operations_required)
):

    # --------------------------------------------------------
    # Find Assignment
    # --------------------------------------------------------

    record = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.assignment_id == assignment_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    # --------------------------------------------------------
    # Validate Driver
    # --------------------------------------------------------

    driver = db.query(Driver).filter(
        Driver.driver_id == assignment.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # If changing to another driver,
    # the new driver must be Available
    if assignment.driver_id != record.driver_id:

        if driver.status != "Available":
            raise HTTPException(
                status_code=400,
                detail="Driver is not available"
            )

    # --------------------------------------------------------
    # Validate Vehicle
    # --------------------------------------------------------

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == assignment.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # If changing to another vehicle,
    # the new vehicle must be Available
    if assignment.vehicle_id != record.vehicle_id:

        if vehicle.status != "Available":
            raise HTTPException(
                status_code=400,
                detail="Vehicle is not available"
            )

    # --------------------------------------------------------
    # Validate Trip
    # --------------------------------------------------------

    trip = db.query(Trip).filter(
        Trip.id == assignment.trip_id
    ).first()

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    # --------------------------------------------------------
    # Update Assignment
    # --------------------------------------------------------

    record.driver_id = assignment.driver_id
    record.vehicle_id = assignment.vehicle_id
    record.trip_id = assignment.trip_id
    record.assignment_status = assignment.assignment_status
    record.remarks = assignment.remarks

    db.commit()
    db.refresh(record)

    return record


# ============================================================
# REMOVE DRIVER ASSIGNMENT
# Administrator / Fleet Manager / Dispatcher
# ============================================================

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    user=Depends(fleet_operations_required)
):

    # --------------------------------------------------------
    # Find Assignment
    # --------------------------------------------------------

    record = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.assignment_id == assignment_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    # --------------------------------------------------------
    # Update Driver Status
    # --------------------------------------------------------

    driver = db.query(Driver).filter(
        Driver.driver_id == record.driver_id
    ).first()

    if driver:
        driver.status = "Available"

    # --------------------------------------------------------
    # Update Vehicle Status
    # --------------------------------------------------------

    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == record.vehicle_id
    ).first()

    if vehicle:
        vehicle.status = "Available"

    # --------------------------------------------------------
    # Delete Assignment
    # --------------------------------------------------------

    db.delete(record)
    db.commit()

    return {
        "message": "Driver assignment removed successfully"
    }