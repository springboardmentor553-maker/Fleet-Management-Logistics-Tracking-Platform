from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.driver_extended import DriverAttendance, DriverActivityLog
from app.schemas.driver import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
    DriverAttendanceCreate,
    DriverAttendanceResponse,
    DriverActivityLogResponse,
    DriverAnalyticsResponse,
)
from app.services.driver import get_all_drivers, get_driver_by_id, create_driver, update_driver, delete_driver

router = APIRouter(prefix="/drivers", tags=["Drivers"])

_mgmt = require_roles(Role.ADMIN, Role.FLEET_MANAGER, Role.DISPATCHER)


@router.get("/manage/analytics", response_model=DriverAnalyticsResponse)
def get_driver_analytics(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    drivers = db.query(Driver).all()
    total = len(drivers)
    active = len([d for d in drivers if not d.is_available])
    present = len([d for d in drivers if d.attendance_status == "present"])
    on_leave = len([d for d in drivers if d.attendance_status == "on_leave"])
    absent = len([d for d in drivers if d.attendance_status == "absent"])

    scores = [d.safety_score for d in drivers if d.safety_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 95.0

    completed_trips = sum([d.completed_trips_count or 0 for d in drivers])

    top_driver = None
    if drivers:
        sorted_drivers = sorted(drivers, key=lambda x: (x.rating or 0, x.completed_trips_count or 0), reverse=True)
        top_driver = sorted_drivers[0].name

    return DriverAnalyticsResponse(
        total_drivers=total,
        active_drivers=active,
        present_today=present,
        on_leave=on_leave,
        absent=absent,
        avg_safety_score=avg_score,
        total_completed_trips=completed_trips,
        top_performing_driver=top_driver,
    )


@router.get("/", response_model=list[DriverResponse])
def list_drivers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_all_drivers(db)


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_driver_by_id(driver_id, db)


@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def add_driver(data: DriverCreate, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    driver = create_driver(data, db)
    # Log driver registration activity
    log = DriverActivityLog(
        driver_id=driver.id,
        action="Driver Registered",
        details=f"Registered driver {driver.name} (License: {driver.license_number})",
    )
    db.add(log)
    db.commit()
    return driver


@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver_route(driver_id: int, data: DriverUpdate, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    driver = update_driver(driver_id, data, db)
    log = DriverActivityLog(
        driver_id=driver.id,
        action="Driver Updated",
        details=f"Updated details for driver {driver.name}",
    )
    db.add(log)
    db.commit()
    return driver


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver_route(driver_id: int, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    delete_driver(driver_id, db)


@router.post("/{driver_id}/attendance", response_model=DriverAttendanceResponse)
def record_driver_attendance(
    driver_id: int,
    data: DriverAttendanceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    valid_statuses = {"present", "absent", "leave", "on_leave"}
    status_clean = data.status.lower().strip()
    if status_clean not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail="Attendance status must be one of: Present, Absent, Leave"
        )

    normalized_status = "on_leave" if status_clean in ["leave", "on_leave"] else status_clean

    driver.attendance_status = normalized_status

    record = DriverAttendance(
        driver_id=driver_id,
        date=data.date,
        status=normalized_status,
        check_in=data.check_in,
        check_out=data.check_out,
    )

    log = DriverActivityLog(
        driver_id=driver_id,
        action="Attendance Marked",
        details=f"Marked {driver.name} as {data.status.upper()} for {data.date}",
    )

    db.add(record)
    db.add(log)
    db.commit()
    db.refresh(record)

    return record


@router.get("/{driver_id}/attendance", response_model=List[DriverAttendanceResponse])
def get_driver_attendance_history(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(DriverAttendance)
        .filter(DriverAttendance.driver_id == driver_id)
        .order_by(DriverAttendance.id.desc())
        .all()
    )


@router.get("/{driver_id}/logs", response_model=List[DriverActivityLogResponse])
def get_driver_logs(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(DriverActivityLog)
        .filter(DriverActivityLog.driver_id == driver_id)
        .order_by(DriverActivityLog.id.desc())
        .all()
    )


@router.patch("/{driver_id}/assign-vehicle", response_model=DriverResponse)
def assign_vehicle_to_driver(
    driver_id: int,
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    if vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        driver.assigned_vehicle_id = vehicle_id
        vehicle.assigned_driver_id = driver_id
        log_msg = f"Assigned vehicle {vehicle.plate_number} to {driver.name}"
    else:
        driver.assigned_vehicle_id = None
        log_msg = f"Unassigned vehicle from {driver.name}"

    log = DriverActivityLog(
        driver_id=driver_id,
        action="Vehicle Assigned",
        details=log_msg,
    )
    db.add(log)
    db.commit()
    db.refresh(driver)
    return driver
