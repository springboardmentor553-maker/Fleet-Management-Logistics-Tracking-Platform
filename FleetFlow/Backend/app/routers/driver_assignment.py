from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db, get_current_user
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
from app.schemas.driver_assignment import DriverPerformanceResponse
from app.utils.dependencies import get_current_user
from app.utils.roles import Role, require_roles

router = APIRouter(
    prefix="/driver-assignments",
    tags=["Driver Assignments"]
)

_mgmt = require_roles(Role.ADMIN, Role.FLEET_MANAGER, Role.DISPATCHER)

@router.post("/", response_model=DriverAssignmentResponse, status_code=status.HTTP_201_CREATED)
def assign_driver(
    data: DriverAssignmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    # Check Driver
    driver = db.query(Driver).filter(Driver.id == data.driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # Check Vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Check Trip only if trip_id is provided
    if data.trip_id is not None:
        trip = db.query(Trip).filter(Trip.id == data.trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=404,
                detail="Trip not found"
            )

    # Driver availability
    if not driver.is_available:
        raise HTTPException(
            status_code=400,
            detail="Driver is not available"
        )

    # Vehicle availability
    if vehicle.current_status != "available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available"
        )

    # Driver already assigned?
    existing_driver = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.driver_id == data.driver_id,
            DriverAssignment.assignment_status == "Assigned"
        )
        .first()
    )

    if existing_driver:
        raise HTTPException(
            status_code=400,
            detail="Driver already assigned to another active trip"
        )

    # Vehicle already assigned?
    existing_vehicle = (
        db.query(DriverAssignment)
        .filter(
            DriverAssignment.vehicle_id == data.vehicle_id,
            DriverAssignment.assignment_status == "Assigned"
        )
        .first()
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already assigned to another active trip"
        )

    assignment = DriverAssignment(
        driver_id=data.driver_id,
        vehicle_id=data.vehicle_id,
        trip_id=data.trip_id,
        remarks=data.remarks,
    )

    db.add(assignment)

    # Automatic status updates
    driver.is_available = False
    driver.assigned_vehicle_id = vehicle.id
    vehicle.current_status = "in_transit"
    vehicle.assigned_driver_id = driver.id

    db.commit()
    db.refresh(assignment)

    return assignment


@router.get("/", response_model=list[DriverAssignmentResponse])
def get_assignments(
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    return db.query(DriverAssignment).all()


@router.put("/{assignment_id}", response_model=DriverAssignmentResponse)
def update_assignment(
    assignment_id: int,
    data: DriverAssignmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    assignment = db.query(DriverAssignment).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if data.assignment_status is not None:
        assignment.assignment_status = data.assignment_status
        if data.assignment_status.lower() in ["completed", "cancelled"]:
            driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
            vehicle = db.query(Vehicle).filter(Vehicle.id == assignment.vehicle_id).first()
            if driver:
                driver.is_available = True
                driver.assigned_vehicle_id = None
            if vehicle:
                vehicle.current_status = "available"
                vehicle.assigned_driver_id = None

    if data.remarks is not None:
        assignment.remarks = data.remarks

    db.commit()
    db.refresh(assignment)

    return assignment


@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    assignment = db.query(DriverAssignment).filter(
        DriverAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    driver = db.query(Driver).filter(
        Driver.id == assignment.driver_id
    ).first()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == assignment.vehicle_id
    ).first()

    if driver:
        driver.is_available = True
        driver.assigned_vehicle_id = None

    if vehicle:
        vehicle.current_status = "available"
        vehicle.assigned_driver_id = None

    db.delete(assignment)
    db.commit()

    return {"message": "Assignment removed successfully"}


@router.get("/performance/{driver_id}", response_model=DriverPerformanceResponse)
def driver_performance(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    trips = db.query(Trip).filter(Trip.driver_id == driver_id).all()

    total = len(trips)
    completed = len([t for t in trips if t.status and t.status.lower() == "completed"])
    active = len([t for t in trips if t.status and t.status.lower() in ["active", "in_progress", "scheduled", "started"]])
    cancelled = len([t for t in trips if t.status and t.status.lower() == "cancelled"])

    return DriverPerformanceResponse(
        driver_id=driver_id,
        total_trips=total,
        completed_trips=completed,
        active_trips=active,
        cancelled_trips=cancelled,
    )


router_driver = APIRouter(prefix="/driver", tags=["Driver Assignments"])


@router_driver.get("/{driver_id}/performance", response_model=DriverPerformanceResponse)
def driver_performance_singular(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    return driver_performance(driver_id, db)
