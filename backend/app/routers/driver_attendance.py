from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models.driver_attendance import DriverAttendance
from backend.app.models.driver import Driver
from backend.app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceUpdate,
    DriverAttendanceResponse,
)
from backend.app.role_checker import role_required

router = APIRouter(
    prefix="/driver-attendance",
    tags=["Driver Attendance"],
)

WRITE_ROLES = ["Admin", "Fleet Manager"]
READ_ROLES = ["Admin", "Fleet Manager", "Dispatcher"]


# ── POST ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=DriverAttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance(
    payload: DriverAttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(WRITE_ROLES)),
):
    """Create an attendance record for a driver."""
    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    record = DriverAttendance(
        driver_id=payload.driver_id,
        date=payload.date,
        attendance_status=payload.attendance_status,
        check_in_time=payload.check_in_time,
        check_out_time=payload.check_out_time,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── GET ALL ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[DriverAttendanceResponse])
def get_all_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(READ_ROLES)),
):
    """Return all attendance records."""
    return db.query(DriverAttendance).all()


# ── GET ONE ───────────────────────────────────────────────────────────────────

@router.get("/{attendance_id}", response_model=DriverAttendanceResponse)
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(READ_ROLES)),
):
    """Return a single attendance record."""
    record = db.query(DriverAttendance).filter(DriverAttendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    return record


# ── PUT ───────────────────────────────────────────────────────────────────────

@router.put("/{attendance_id}", response_model=DriverAttendanceResponse)
def update_attendance(
    attendance_id: int,
    payload: DriverAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(WRITE_ROLES)),
):
    """Update an existing attendance record."""
    record = db.query(DriverAttendance).filter(DriverAttendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    # Validate new driver_id if it is changing
    if payload.driver_id is not None and payload.driver_id != record.driver_id:
        driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
        if not driver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        record.driver_id = payload.driver_id

    if payload.date is not None:
        record.date = payload.date
    if payload.attendance_status is not None:
        record.attendance_status = payload.attendance_status
    if payload.check_in_time is not None:
        record.check_in_time = payload.check_in_time
    if payload.check_out_time is not None:
        record.check_out_time = payload.check_out_time

    db.commit()
    db.refresh(record)
    return record


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{attendance_id}", status_code=status.HTTP_200_OK)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(WRITE_ROLES)),
):
    """Delete an attendance record."""
    record = db.query(DriverAttendance).filter(DriverAttendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    db.delete(record)
    db.commit()
    return {"message": "Attendance record deleted successfully"}
