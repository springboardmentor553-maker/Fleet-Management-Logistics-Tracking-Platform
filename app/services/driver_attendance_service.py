from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.driver_attendance import DriverAttendance
from app.models.driver import Driver
from app.schemas.driver_attendance import DriverAttendanceCreate


def mark_attendance(attendance: DriverAttendanceCreate, db: Session):

    driver = db.query(Driver).filter(Driver.id == attendance.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    new_record = DriverAttendance(**attendance.model_dump())

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


def get_all_attendance(db: Session):
    return db.query(DriverAttendance).all()


def get_driver_attendance(driver_id: int, db: Session):
    return db.query(DriverAttendance).filter(DriverAttendance.driver_id == driver_id).all()