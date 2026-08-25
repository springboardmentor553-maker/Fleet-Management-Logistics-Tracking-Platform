from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role

router = APIRouter(prefix="/driver-attendance", tags=["Driver Attendance"])

VALID_ATTENDANCE_STATUSES = ["present", "absent", "leave"]


@router.post("/", response_model=schemas.DriverAttendanceResponse)
def create_attendance(
    record: schemas.DriverAttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "fleet_manager")),
):
    driver = db.query(models.Driver).filter(models.Driver.id == record.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    if record.status not in VALID_ATTENDANCE_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {VALID_ATTENDANCE_STATUSES}")

    new_record = models.DriverAttendance(**record.dict())
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.get("/", response_model=list[schemas.DriverAttendanceResponse])
def list_attendance(driver_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.DriverAttendance)
    if driver_id is not None:
        query = query.filter(models.DriverAttendance.driver_id == driver_id)
    return query.order_by(models.DriverAttendance.date.desc()).all()


@router.get("/{attendance_id}", response_model=schemas.DriverAttendanceResponse)
def get_attendance(attendance_id: int, db: Session = Depends(get_db)):
    record = db.query(models.DriverAttendance).filter(models.DriverAttendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    return record


@router.put("/{attendance_id}", response_model=schemas.DriverAttendanceResponse)
def update_attendance(
    attendance_id: int,
    updated: schemas.DriverAttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "fleet_manager")),
):
    record = db.query(models.DriverAttendance).filter(models.DriverAttendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    if updated.status not in VALID_ATTENDANCE_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {VALID_ATTENDANCE_STATUSES}")

    for key, value in updated.dict().items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    record = db.query(models.DriverAttendance).filter(models.DriverAttendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    db.delete(record)
    db.commit()
    return {"message": "Attendance record deleted successfully"}