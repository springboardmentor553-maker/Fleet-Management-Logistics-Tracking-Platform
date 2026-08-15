from sqlalchemy.orm import Session

from app.models.driver_attendance import DriverAttendance
from app.models.driver import Driver

from app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceUpdate
)


ALLOWED_ATTENDANCE_STATUSES = [
    "Present",
    "Absent",
    "Leave"
]


def create_attendance(
    db: Session,
    attendance: DriverAttendanceCreate
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == attendance.driver_id)
        .first()
    )

    if not driver:
        raise ValueError("Driver not found")

    if attendance.attendance_status not in ALLOWED_ATTENDANCE_STATUSES:
        raise ValueError("Invalid attendance status")

    db_attendance = DriverAttendance(
        driver_id=attendance.driver_id,
        date=attendance.date,
        attendance_status=attendance.attendance_status,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time
    )

    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)

    return db_attendance


def get_all_attendance(db: Session):
    return db.query(DriverAttendance).all()


def get_attendance_by_id(
    db: Session,
    attendance_id: int
):

    return (
        db.query(DriverAttendance)
        .filter(DriverAttendance.id == attendance_id)
        .first()
    )


def update_attendance(
    db: Session,
    attendance_id: int,
    attendance: DriverAttendanceUpdate
):

    db_attendance = get_attendance_by_id(
        db,
        attendance_id
    )

    if not db_attendance:
        return None

    update_data = attendance.model_dump(
        exclude_unset=True
    )

    if "attendance_status" in update_data:

        if update_data["attendance_status"] not in ALLOWED_ATTENDANCE_STATUSES:
            raise ValueError("Invalid attendance status")

    for key, value in update_data.items():

        setattr(
            db_attendance,
            key,
            value
        )

    db.commit()
    db.refresh(db_attendance)

    return db_attendance


def delete_attendance(
    db: Session,
    attendance_id: int
):

    db_attendance = get_attendance_by_id(
        db,
        attendance_id
    )

    if not db_attendance:
        return None

    db.delete(db_attendance)
    db.commit()

    return db_attendance