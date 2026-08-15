from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.driver_assignment import DriverAssignment, AssignmentStatus
from app.models.driver import Driver, DriverStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.trip import Trip, TripStatus
from app.models.user import UserRole
from app.schemas.driver_assignment import DriverAssignmentCreate, DriverAssignmentUpdate, DriverAssignmentResponse
from app.utils.dependencies import get_current_active_user, require_admin, require_dispatcher, require_driver_or_higher

router = APIRouter(
    prefix="/driver-assignments",
    tags=["Driver Assignments"]
)

@router.post("", response_model=DriverAssignmentResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_dispatcher)])
def create_driver_assignment(assignment: DriverAssignmentCreate, db: Session = Depends(get_db)):
    # Verify Driver exists and is AVAILABLE
    driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    if driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Driver is not AVAILABLE")
        
    # Verify Vehicle exists and is ACTIVE
    vehicle = db.query(Vehicle).filter(Vehicle.id == assignment.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status != VehicleStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Vehicle is not ACTIVE")
        
    # Verify Trip exists
    trip = db.query(Trip).filter(Trip.id == assignment.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    # Verify Driver doesn't have an active assignment
    existing_driver_assignment = db.query(DriverAssignment).filter(
        DriverAssignment.driver_id == assignment.driver_id,
        DriverAssignment.assignment_status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE])
    ).first()
    if existing_driver_assignment:
        raise HTTPException(status_code=400, detail="Driver already has an active or assigned trip")
        
    # Verify Vehicle is not assigned to another active trip
    existing_vehicle_assignment = db.query(DriverAssignment).filter(
        DriverAssignment.vehicle_id == assignment.vehicle_id,
        DriverAssignment.assignment_status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE])
    ).first()
    if existing_vehicle_assignment:
        raise HTTPException(status_code=400, detail="Vehicle is already assigned to an active trip")

    new_assignment = DriverAssignment(**assignment.model_dump())
    db.add(new_assignment)
    
    # Sync with Trip
    trip.driver_id = assignment.driver_id
    trip.vehicle_id = assignment.vehicle_id
    
    # Update driver status to ON_TRIP
    driver.status = DriverStatus.ON_TRIP
    
    db.commit()
    db.refresh(new_assignment)
    
    res = DriverAssignmentResponse.model_validate(new_assignment)
    if new_assignment.driver and new_assignment.driver.user:
        res.driver_name = new_assignment.driver.user.full_name
    if new_assignment.vehicle:
        res.vehicle_plate = new_assignment.vehicle.license_plate
    return res

@router.get("", response_model=List[DriverAssignmentResponse], dependencies=[Depends(require_driver_or_higher)])
def get_driver_assignments(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    query = db.query(DriverAssignment)
    
    if current_user.role == UserRole.DRIVER:
        # Driver can only view their own assignments
        driver_profile = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver_profile:
            return []
        query = query.filter(DriverAssignment.driver_id == driver_profile.id)
        
    assignments = query.options(joinedload(DriverAssignment.driver).joinedload(Driver.user), joinedload(DriverAssignment.vehicle)).order_by(DriverAssignment.id.desc()).all()
    results = []
    for a in assignments:
        resp = DriverAssignmentResponse.model_validate(a)
        if a.driver and a.driver.user:
            resp.driver_name = a.driver.user.full_name
        if a.vehicle:
            resp.vehicle_plate = a.vehicle.license_plate
        results.append(resp)
    return results

@router.get("/{id}", response_model=DriverAssignmentResponse, dependencies=[Depends(require_driver_or_higher)])
def get_driver_assignment(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    assignment = db.query(DriverAssignment).filter(DriverAssignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if current_user.role == UserRole.DRIVER:
        driver_profile = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver_profile or assignment.driver_id != driver_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this assignment")
            
    res = DriverAssignmentResponse.model_validate(assignment)
    if assignment.driver and assignment.driver.user:
        res.driver_name = assignment.driver.user.full_name
    if assignment.vehicle:
        res.vehicle_plate = assignment.vehicle.license_plate
    return res

@router.put("/{id}", response_model=DriverAssignmentResponse, dependencies=[Depends(require_dispatcher)])
def update_driver_assignment(id: int, assignment_update: DriverAssignmentUpdate, db: Session = Depends(get_db)):
    assignment = db.query(DriverAssignment).filter(DriverAssignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    old_status = assignment.assignment_status
        
    for key, value in assignment_update.model_dump(exclude_unset=True).items():
        setattr(assignment, key, value)
        
    # Handle driver status update if assignment is completed or cancelled
    if assignment_update.assignment_status in [AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED] and old_status not in [AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED]:
        driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
        if driver:
            driver.status = DriverStatus.AVAILABLE
            
    db.commit()
    db.refresh(assignment)
    
    res = DriverAssignmentResponse.model_validate(assignment)
    if assignment.driver and assignment.driver.user:
        res.driver_name = assignment.driver.user.full_name
    if assignment.vehicle:
        res.vehicle_plate = assignment.vehicle.license_plate
    return res

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_driver_assignment(id: int, db: Session = Depends(get_db)):
    assignment = db.query(DriverAssignment).filter(DriverAssignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.assignment_status in [AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE]:
        driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
        if driver:
            driver.status = DriverStatus.AVAILABLE
            
    db.delete(assignment)
    db.commit()
    return None
