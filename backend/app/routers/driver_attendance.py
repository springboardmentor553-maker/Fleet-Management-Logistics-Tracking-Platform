from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.logs.logger import logger
from app.database import get_db
from app.utils.security import require_role
from app.models.driver import Driver
from app.models.driver_attendance import DriverAttendance
from app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceUpdate,
    DriverAttendanceResponse,
)


router = APIRouter(
    prefix="/driver-attendance",
    tags=["Driver Attendance"],
)


@router.post(
    "/",
    response_model=DriverAttendanceResponse,
)
def create_attendance(
    attendance: DriverAttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager", "Driver"])),
):
    driver = (
        db.query(Driver)
        .filter(Driver.id == attendance.driver_id)
        .first()
    )

    if not driver:
        logger.warning(
            f"Attendance Creation Failed | Driver={attendance.driver_id}"
        )

        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    new_attendance = DriverAttendance(
        **attendance.model_dump()
    )

    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)

    logger.info(
        f"Attendance Created | ID={new_attendance.id} "
        f"| Driver={attendance.driver_id}"
    )

    return new_attendance


@router.get(
    "/",
    response_model=list[DriverAttendanceResponse],
)
def get_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    records = (
        db.query(DriverAttendance)
        .all()
    )

    logger.info(
        f"Attendance List Viewed | Total={len(records)}"
    )

    return records


@router.put(
    "/{attendance_id}",
    response_model=DriverAttendanceResponse,
)
def update_attendance(
    attendance_id: int,
    attendance: DriverAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin", "Fleet Manager", "Driver"])),
):
    record = (
        db.query(DriverAttendance)
        .filter(DriverAttendance.id == attendance_id)
        .first()
    )

    if not record:
        logger.warning(
            f"Attendance Update Failed | ID={attendance_id}"
        )

        raise HTTPException(
            status_code=404,
            detail="Attendance record not found",
        )

    update_data = attendance.model_dump(
        exclude_unset=True
    )

    # If driver_id is being changed, verify the driver exists.
    if "driver_id" in update_data:
        driver = (
            db.query(Driver)
            .filter(Driver.id == update_data["driver_id"])
            .first()
        )

        if not driver:
            raise HTTPException(
                status_code=404,
                detail="Driver not found",
            )

    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)

    logger.info(
        f"Attendance Updated | ID={record.id}"
    )

    return record


@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Fleet Manager"])
    ),
):
    record = (
        db.query(DriverAttendance)
        .filter(DriverAttendance.id == attendance_id)
        .first()
    )

    if not record:
        logger.warning(
            f"Attendance Delete Failed | ID={attendance_id}"
        )

        raise HTTPException(
            status_code=404,
            detail="Attendance record not found",
        )

    db.delete(record)
    db.commit()

    logger.info(
        f"Attendance Deleted | ID={attendance_id}"
    )

    return {
        "message": "Attendance record deleted successfully"
    }