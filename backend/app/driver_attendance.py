from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role

from app.models.driver import Driver
from app.models.driver_attendance import DriverAttendance
from app.models.user import User

from app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceUpdate,
    DriverAttendanceResponse,
)

router = APIRouter()


# -----------------------------------------
# CREATE ATTENDANCE
# -----------------------------------------

@router.post(
    "/",
    response_model=DriverAttendanceResponse
)
def create_attendance(
    attendance: DriverAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    ),
):
    driver = db.query(Driver).filter(
        Driver.id == attendance.driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found."
        )

    if attendance.attendance_status not in [
        "Present",
        "Absent",
        "Leave",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid attendance status. Allowed values are Present, Absent, Leave."
        )

    existing = db.query(DriverAttendance).filter(
        DriverAttendance.driver_id == attendance.driver_id,
        DriverAttendance.date == attendance.date,
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Attendance already exists for this driver and date."
        )

    new_attendance = DriverAttendance(
        driver_id=attendance.driver_id,
        date=attendance.date,
        attendance_status=attendance.attendance_status,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
    )

    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)

    return new_attendance


# -----------------------------------------
# GET ALL ATTENDANCE
# -----------------------------------------

@router.get(
    "/",
    response_model=list[DriverAttendanceResponse]
)
def get_all_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
        )
    ),
):
    return db.query(DriverAttendance).order_by(
        DriverAttendance.date.desc()
    ).all()


# -----------------------------------------
# GET ATTENDANCE BY ID
# -----------------------------------------

@router.get(
    "/{attendance_id}",
    response_model=DriverAttendanceResponse
)
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher",
        )
    ),
):
    attendance = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.id == attendance_id
    ).first()

    if attendance is None:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found."
        )

    return attendance


# -----------------------------------------
# UPDATE ATTENDANCE
# -----------------------------------------

@router.put(
    "/{attendance_id}",
    response_model=DriverAttendanceResponse
)
def update_attendance(
    attendance_id: int,
    attendance: DriverAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
        )
    ),
):
    db_attendance = db.query(
        DriverAttendance
    ).filter(
        DriverAttendance.id == attendance_id
    ).first()

    if db_attendance is None:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found."
        )

    update_data = attendance.model_dump(
        exclude_unset=True
    )

    if (
        "attendance_status" in update_data
        and update_data["attendance_status"]
        not in ["Present", "Absent", "Leave"]
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid attendance status. Allowed values are Present, Absent, Leave."
        )

    for key, value in update_data.items():
        setattr(
            db_attendance,
            key,
            value
        )

    db.commit()
    db.refresh(db_attendance)

    return db_attendance