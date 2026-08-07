from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.driver_attendance import DriverAttendanceCreate, DriverAttendanceResponse
from app.services.driver_attendance_service import (
    mark_attendance,
    get_all_attendance,
    get_driver_attendance,
)

router = APIRouter(
    prefix="/driver-attendance",
    tags=["Driver Attendance"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=DriverAttendanceResponse)
def add_attendance(attendance: DriverAttendanceCreate, db: Session = Depends(get_db)):
    return mark_attendance(attendance, db)


@router.get("/", response_model=list[DriverAttendanceResponse])
def fetch_all_attendance(db: Session = Depends(get_db)):
    return get_all_attendance(db)


@router.get("/{driver_id}", response_model=list[DriverAttendanceResponse])
def fetch_driver_attendance(driver_id: int, db: Session = Depends(get_db)):
    return get_driver_attendance(driver_id, db)