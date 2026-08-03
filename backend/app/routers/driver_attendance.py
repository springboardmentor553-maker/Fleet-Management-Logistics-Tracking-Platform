from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DriverAttendance, Driver
from app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceResponse
)

router = APIRouter(
    prefix="/driver-attendance",
    tags=["Driver Attendance"]
)


# Create Attendance
@router.post("/", response_model=DriverAttendanceResponse)
def create_attendance(
    attendance: DriverAttendanceCreate,
    db: Session = Depends(get_db)
):

    driver = db.query(Driver).filter(
        Driver.driver_id == attendance.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

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


# View All Attendance
@router.get("/", response_model=list[DriverAttendanceResponse])
def get_attendance(db: Session = Depends(get_db)):
    return db.query(DriverAttendance).all()


# View Attendance by ID
@router.get("/{attendance_id}", response_model=DriverAttendanceResponse)
def get_attendance_by_id(
    attendance_id: int,
    db: Session = Depends(get_db)
):
    attendance = db.query(DriverAttendance).filter(
        DriverAttendance.attendance_id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    return attendance


# Update Attendance
@router.put("/{attendance_id}", response_model=DriverAttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance: DriverAttendanceCreate,
    db: Session = Depends(get_db)
):
    record = db.query(DriverAttendance).filter(
        DriverAttendance.attendance_id == attendance_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    record.driver_id = attendance.driver_id
    record.date = attendance.date
    record.attendance_status = attendance.attendance_status
    record.check_in_time = attendance.check_in_time
    record.check_out_time = attendance.check_out_time

    db.commit()
    db.refresh(record)

    return record


# Delete Attendance
@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(DriverAttendance).filter(
        DriverAttendance.attendance_id == attendance_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    db.delete(record)
    db.commit()

    return {"message": "Attendance deleted successfully"}