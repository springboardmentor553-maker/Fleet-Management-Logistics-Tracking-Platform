from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver, DriverAttendance

from app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceResponse
)

from app.dependencies import (
    fleet_operations_required,
    driver_view_required
)


router = APIRouter(
    prefix="/driver-attendance",
    tags=["Driver Attendance"]
)


# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# CREATE ATTENDANCE
# ============================================================

@router.post(
    "/",
    response_model=DriverAttendanceResponse
)
def create_attendance(
    attendance: DriverAttendanceCreate,
    user=Depends(fleet_operations_required),
    db: Session = Depends(get_db)
):

    # Validate Driver
    driver = db.query(Driver).filter(
        Driver.driver_id == attendance.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # Prevent duplicate attendance
    existing_attendance = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.driver_id == attendance.driver_id,
        DriverAttendance.date == attendance.date
    ).first()

    if existing_attendance:
        raise HTTPException(
            status_code=400,
            detail=(
                "Attendance already recorded for "
                "this driver on this date"
            )
        )

    # Create attendance
    new_attendance = DriverAttendance(
        driver_id=attendance.driver_id,
        date=attendance.date,
        attendance_status=attendance.attendance_status,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time
    )

    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)

    return new_attendance


# ============================================================
# GET ALL ATTENDANCE
# ============================================================

@router.get(
    "/",
    response_model=list[DriverAttendanceResponse]
)
def get_all_attendance(
    user=Depends(driver_view_required),
    db: Session = Depends(get_db)
):

    return db.query(
        DriverAttendance
    ).order_by(
        DriverAttendance.date.desc()
    ).all()


# ============================================================
# GET ATTENDANCE BY ID
# ============================================================

@router.get(
    "/{attendance_id}",
    response_model=DriverAttendanceResponse
)
def get_attendance(
    attendance_id: int,
    user=Depends(driver_view_required),
    db: Session = Depends(get_db)
):

    attendance = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.attendance_id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    return attendance


# ============================================================
# GET ATTENDANCE BY DRIVER
# ============================================================

@router.get(
    "/driver/{driver_id}",
    response_model=list[DriverAttendanceResponse]
)
def get_driver_attendance(
    driver_id: int,
    user=Depends(driver_view_required),
    db: Session = Depends(get_db)
):

    driver = db.query(Driver).filter(
        Driver.driver_id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.driver_id == driver_id
    ).order_by(
        DriverAttendance.date.desc()
    ).all()


# ============================================================
# UPDATE ATTENDANCE
# ============================================================

@router.put(
    "/{attendance_id}",
    response_model=DriverAttendanceResponse
)
def update_attendance(
    attendance_id: int,
    attendance: DriverAttendanceCreate,
    user=Depends(fleet_operations_required),
    db: Session = Depends(get_db)
):

    # Find existing record
    existing = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.attendance_id == attendance_id
    ).first()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    # Validate Driver
    driver = db.query(Driver).filter(
        Driver.driver_id == attendance.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # Prevent duplicate date for another record
    duplicate = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.driver_id == attendance.driver_id,
        DriverAttendance.date == attendance.date,
        DriverAttendance.attendance_id != attendance_id
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail=(
                "Another attendance record already exists "
                "for this driver on this date"
            )
        )

    # Update
    existing.driver_id = attendance.driver_id
    existing.date = attendance.date
    existing.attendance_status = attendance.attendance_status
    existing.check_in_time = attendance.check_in_time
    existing.check_out_time = attendance.check_out_time

    db.commit()
    db.refresh(existing)

    return existing


# ============================================================
# DELETE ATTENDANCE
# ============================================================

@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    user=Depends(fleet_operations_required),
    db: Session = Depends(get_db)
):

    attendance = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.attendance_id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    db.delete(attendance)
    db.commit()

    return {
        "message": "Attendance deleted successfully"
    }