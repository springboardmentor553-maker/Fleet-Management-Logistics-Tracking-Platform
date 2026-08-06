from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.driver import Driver
from app.models.driver_attendance import DriverAttendance
from app.schemas.driver import (
    DriverAttendanceCreate,
    DriverAttendanceResponse,
)

router = APIRouter(
    prefix="/attendance",
    tags=["Driver Attendance"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from datetime import date

@router.post("/", response_model=DriverAttendanceResponse)
def mark_attendance(
    data: DriverAttendanceCreate,
    db: Session = Depends(get_db),
):
    # Check driver exists
    driver = db.query(Driver).filter(Driver.id == data.driver_id).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    # Prevent duplicate attendance for the same day
    existing = (
        db.query(DriverAttendance)
        .filter(
            DriverAttendance.driver_id == data.driver_id,
            DriverAttendance.attendance_date == data.attendance_date,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this date."
        )

    attendance = DriverAttendance(
        driver_id=data.driver_id,
        attendance_date=data.attendance_date,
        status=data.status,
        check_in=data.check_in,
        check_out=data.check_out,
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance