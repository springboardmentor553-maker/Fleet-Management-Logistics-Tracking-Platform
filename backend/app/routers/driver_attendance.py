from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.driver_attendance import DriverAttendance
from app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceUpdate
)

from app.utils.audit import create_audit_log
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/driver-attendance",
    tags=["Driver Attendance"]
)


# =====================================================
# Create Attendance
# =====================================================

@router.post("/")
def create_attendance(
    attendance: DriverAttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    driver = db.query(Driver).filter(
        Driver.id == attendance.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    record = DriverAttendance(
        driver_id=attendance.driver_id,
        date=attendance.date,
        attendance_status=attendance.attendance_status,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time
    )

    db.add(record)

    # Generate attendance ID before audit
    db.flush()

    create_audit_log(
        db=db,
        user=current_user,
        module="Driver Attendance",
        action="CREATE",
        details=(
            f"Attendance record ID {record.id} was created "
            f"for Driver ID {record.driver_id}. "
            f"Date: {record.date}, "
            f"Status: {record.attendance_status}."
        )
    )

    db.commit()
    db.refresh(record)

    return {
        "message": "Attendance recorded successfully",
        "attendance": record
    }


# =====================================================
# Get All Attendance
# =====================================================

@router.get("/")
def get_all_attendance(
    db: Session = Depends(get_db)
):

    return db.query(DriverAttendance).all()


# =====================================================
# Get Attendance by ID
# =====================================================

@router.get("/{attendance_id}")
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db)
):

    attendance = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    return attendance


# =====================================================
# Update Attendance
# =====================================================

@router.put("/{attendance_id}")
def update_attendance(
    attendance_id: int,
    updated: DriverAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    attendance = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    old_status = attendance.attendance_status

    values = updated.model_dump(
        exclude_unset=True
    )

    for key, value in values.items():
        setattr(attendance, key, value)

    create_audit_log(
        db=db,
        user=current_user,
        module="Driver Attendance",
        action="UPDATE",
        details=(
            f"Attendance record ID {attendance.id} "
            f"for Driver ID {attendance.driver_id} was updated. "
            f"Status: {old_status} -> "
            f"{attendance.attendance_status}."
        )
    )

    db.commit()
    db.refresh(attendance)

    return {
        "message": "Attendance updated successfully",
        "attendance": attendance
    }


# =====================================================
# Delete Attendance
# =====================================================

@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    attendance = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    record_id = attendance.id
    driver_id = attendance.driver_id
    attendance_date = attendance.date

    create_audit_log(
        db=db,
        user=current_user,
        module="Driver Attendance",
        action="DELETE",
        details=(
            f"Attendance record ID {record_id} "
            f"for Driver ID {driver_id} "
            f"on {attendance_date} was deleted."
        )
    )

    db.delete(attendance)

    db.commit()

    return {
        "message": "Attendance deleted successfully"
    }