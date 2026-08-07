
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.driver_attendance import DriverAttendance
from app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceResponse,
    DriverAttendanceUpdate,
)

router = APIRouter(
    prefix="/driver-attendance",
    tags=["Driver Attendance"]
)
@router.post("/", response_model=DriverAttendanceResponse)
def mark_attendance(
    attendance: DriverAttendanceCreate,
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(
        Driver.id == attendance.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    existing = db.query(DriverAttendance).filter(
        DriverAttendance.driver_id == attendance.driver_id,
        DriverAttendance.date == attendance.date
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this driver today."
        )

    db_attendance = DriverAttendance(**attendance.model_dump())

    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)

    return db_attendance
@router.get("/", response_model=list[DriverAttendanceResponse])
def get_attendance(
    db: Session = Depends(get_db)
):
    return db.query(DriverAttendance).all()
@router.get("/{driver_id}", response_model=list[DriverAttendanceResponse])
def get_driver_attendance(
    driver_id: int,
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return db.query(DriverAttendance).filter(
        DriverAttendance.driver_id == driver_id
    ).all()
@router.put("/{attendance_id}", response_model=DriverAttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance_data: DriverAttendanceUpdate,
    db: Session = Depends(get_db)
):
    attendance = db.query(DriverAttendance).filter(
        DriverAttendance.id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    for key, value in attendance_data.model_dump(exclude_unset=True).items():
        setattr(attendance, key, value)

    db.commit()
    db.refresh(attendance)

    return attendance
@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db)
):
    attendance = db.query(DriverAttendance).filter(
        DriverAttendance.id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    db.delete(attendance)
    db.commit()

    return {
        "message": "Attendance record deleted successfully"
    }