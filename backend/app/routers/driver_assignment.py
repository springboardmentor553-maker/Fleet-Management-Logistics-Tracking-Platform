from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.driver_assignment import DriverAssignment
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip

from app.schemas.driver_assignment import (
    DriverAssignmentCreate,
    DriverAssignmentRelease,
    DriverAssignmentUpdate
)

from app.utils.audit import create_audit_log
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/driver-assignments",
    tags=["Driver Assignment"]
)


# =====================================================
# Assign Driver
# =====================================================

@router.post("/")
def assign_driver(
    assignment: DriverAssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    driver = db.query(Driver).filter(
        Driver.id == assignment.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if driver.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Driver is not available."
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == assignment.vehicle_id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    if vehicle.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available."
        )

    trip = db.query(Trip).filter(
        Trip.id == assignment.trip_id
    ).first()

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    existing = db.query(DriverAssignment).filter(
        DriverAssignment.driver_id == assignment.driver_id,
        DriverAssignment.status == "Assigned"
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Driver is already assigned."
        )

    new_assignment = DriverAssignment(
        driver_id=assignment.driver_id,
        vehicle_id=assignment.vehicle_id,
        trip_id=assignment.trip_id,
        assignment_date=assignment.assignment_date,
        status="Assigned",
        remarks=assignment.remarks
    )

    db.add(new_assignment)

    driver.status = "Assigned"
    vehicle.status = "In Transit"

    # Generate assignment ID
    db.flush()

    # Audit log
    create_audit_log(
        db=db,
        user=current_user,
        module="Driver Assignment",
        action="CREATE",
        details=(
            f"Driver ID {driver.id} was assigned to "
            f"Vehicle ID {vehicle.id} for Trip ID {trip.id}. "
            f"Assignment ID: {new_assignment.id}."
        )
    )

    db.commit()
    db.refresh(new_assignment)

    return {
        "message": "Driver assigned successfully",
        "assignment": new_assignment
    }


# =====================================================
# View All Assignments
# =====================================================

@router.get("/")
def get_all_assignments(
    db: Session = Depends(get_db)
):
    return db.query(DriverAssignment).all()


# =====================================================
# View Assignment By ID
# =====================================================

@router.get("/{assignment_id}")
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):

    assignment = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    return assignment


# =====================================================
# Update Assignment
# =====================================================

@router.put("/{assignment_id}")
def update_assignment(
    assignment_id: int,
    updated: DriverAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    assignment = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    values = updated.model_dump(exclude_unset=True)

    if "trip_id" in values:

        trip = db.query(Trip).filter(
            Trip.id == values["trip_id"]
        ).first()

        if not trip:
            raise HTTPException(
                status_code=404,
                detail="Trip not found"
            )

    for key, value in values.items():
        setattr(assignment, key, value)

    create_audit_log(
        db=db,
        user=current_user,
        module="Driver Assignment",
        action="UPDATE",
        details=(
            f"Driver Assignment ID {assignment.id} "
            f"was updated."
        )
    )

    db.commit()
    db.refresh(assignment)

    return {
        "message": "Assignment updated successfully",
        "assignment": assignment
    }


# =====================================================
# Release Driver
# =====================================================

@router.patch("/{assignment_id}/release")
def release_driver(
    assignment_id: int,
    data: DriverAssignmentRelease,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    assignment = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    assignment.release_date = data.release_date
    assignment.status = "Released"

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

    create_audit_log(
        db=db,
        user=current_user,
        module="Driver Assignment",
        action="RELEASE",
        details=(
            f"Driver Assignment ID {assignment.id} "
            f"was released. Driver ID: {assignment.driver_id}, "
            f"Vehicle ID: {assignment.vehicle_id}."
        )
    )

    db.commit()
    db.refresh(assignment)

    return {
        "message": "Driver released successfully",
        "assignment": assignment
    }


# =====================================================
# Remove Assignment
# =====================================================

@router.delete("/{assignment_id}")
def remove_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    assignment = db.query(
        DriverAssignment
    ).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    driver_id = assignment.driver_id
    vehicle_id = assignment.vehicle_id
    assignment_id_value = assignment.id

    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if driver:
        driver.status = "Available"

    if vehicle:
        vehicle.status = "Available"

    # Audit BEFORE deleting assignment
    create_audit_log(
        db=db,
        user=current_user,
        module="Driver Assignment",
        action="DELETE",
        details=(
            f"Driver Assignment ID {assignment_id_value} "
            f"was removed. Driver ID: {driver_id}, "
            f"Vehicle ID: {vehicle_id}."
        )
    )

    db.delete(assignment)

    db.commit()

    return {
        "message": "Assignment removed successfully"
    }