from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.logs.logger import logger
from app.models.driver import Driver, DriverStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.trip import Trip
from app.models.driver_assignment import DriverAssignment
from app.utils.security import require_role
from app.schemas.driver_assignment import (
    DriverAssignmentCreate,
    DriverAssignmentResponse,
)


router = APIRouter(
    prefix="/driver-assignment",
    tags=["Driver Assignment"],
)


@router.post("/", response_model=DriverAssignmentResponse)
def assign_driver(
    assignment: DriverAssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    # Check driver
    driver = (
        db.query(Driver)
        .filter(Driver.id == assignment.driver_id)
        .first()
    )

    if not driver:
        logger.warning(
            f"Driver Assignment Failed | Driver={assignment.driver_id}"
        )
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    # Check vehicle
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == assignment.vehicle_id)
        .first()
    )

    if not vehicle:
        logger.warning(
            f"Driver Assignment Failed | Vehicle={assignment.vehicle_id}"
        )
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    # Check trip
    trip = (
        db.query(Trip)
        .filter(Trip.id == assignment.trip_id)
        .first()
    )

    if not trip:
        logger.warning(
            f"Driver Assignment Failed | Trip={assignment.trip_id}"
        )
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    # Check whether driver already has an active assignment
    existing_driver = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.driver_id == assignment.driver_id,
            DriverAssignment.status == "Assigned",
        )
        .first()
    )

    if existing_driver:
        logger.warning(
            f"Driver Already Assigned | Driver={assignment.driver_id}"
        )
        raise HTTPException(
            status_code=400,
            detail="Driver already assigned",
        )

    # Check whether vehicle already has an active assignment
    existing_vehicle = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.vehicle_id == assignment.vehicle_id,
            DriverAssignment.status == "Assigned",
        )
        .first()
    )

    if existing_vehicle:
        logger.warning(
            f"Vehicle Already Assigned | Vehicle={assignment.vehicle_id}"
        )
        raise HTTPException(
            status_code=400,
            detail="Vehicle already assigned",
        )

    # Create assignment
    new_assignment = DriverAssignment(
        driver_id=assignment.driver_id,
        vehicle_id=assignment.vehicle_id,
        trip_id=assignment.trip_id,
    )

    db.add(new_assignment)

    # Update current statuses using existing enums
    driver.status = DriverStatus.ON_TRIP
    vehicle.status = VehicleStatus.ACTIVE

    db.commit()
    db.refresh(new_assignment)

    logger.info(
        f"Driver Assigned | Assignment={new_assignment.id} "
        f"| Driver={driver.id} | Vehicle={vehicle.id}"
    )

    return new_assignment


@router.get(
    "/",
    response_model=list[DriverAssignmentResponse],
)
def get_assignments(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    assignments = (
        db.query(DriverAssignment)
        .all()
    )

    logger.info(
        f"Driver Assignment List Viewed | Total={len(assignments)}"
    )

    return assignments


@router.put(
    "/{assignment_id}",
    response_model=DriverAssignmentResponse,
)
def update_assignment(
    assignment_id: int,
    data: DriverAssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    assignment = (
        db.query(DriverAssignment)
        .filter(DriverAssignment.id == assignment_id)
        .first()
    )

    if not assignment:
        logger.warning(
            f"Assignment Update Failed | ID={assignment_id}"
        )
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    # Validate driver
    driver = (
        db.query(Driver)
        .filter(Driver.id == data.driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    # Validate vehicle
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == data.vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    # Validate trip
    trip = (
        db.query(Trip)
        .filter(Trip.id == data.trip_id)
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    assignment.driver_id = data.driver_id
    assignment.vehicle_id = data.vehicle_id
    assignment.trip_id = data.trip_id

    db.commit()
    db.refresh(assignment)

    logger.info(
        f"Assignment Updated | ID={assignment.id}"
    )

    return assignment


@router.put("/{assignment_id}/complete")
def complete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    assignment = (
        db.query(DriverAssignment)
        .filter(DriverAssignment.id == assignment_id)
        .first()
    )

    if not assignment:
        logger.warning(
            f"Assignment Completion Failed | ID={assignment_id}"
        )
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    driver = (
        db.query(Driver)
        .filter(Driver.id == assignment.driver_id)
        .first()
    )

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == assignment.vehicle_id)
        .first()
    )

    assignment.status = "Completed"

    if driver:
        driver.status = DriverStatus.AVAILABLE

    if vehicle:
        vehicle.status = VehicleStatus.ACTIVE

    db.commit()

    logger.info(
        f"Assignment Completed | ID={assignment.id}"
    )

    return {
        "message": "Assignment completed successfully"
    }


@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    assignment = (
        db.query(DriverAssignment)
        .filter(DriverAssignment.id == assignment_id)
        .first()
    )

    if not assignment:
        logger.warning(
            f"Assignment Delete Failed | ID={assignment_id}"
        )
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    db.delete(assignment)
    db.commit()

    logger.info(
        f"Assignment Deleted | ID={assignment_id}"
    )

    return {
        "message": "Assignment deleted successfully"
    }