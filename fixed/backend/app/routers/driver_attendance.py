from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.routers.crud import commit_or_409
from app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceRead,
    DriverAttendanceUpdate,
)

router = APIRouter()


def get_or_404(db: Session, model, item_id: int, label: str):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found")
    return item


@router.post("/", response_model=DriverAttendanceRead, status_code=status.HTTP_201_CREATED)
def create_driver_attendance(payload: DriverAttendanceCreate, db: Session = Depends(get_db)):
    """Create Driver Attendance (Task 2)"""
    get_or_404(db, models.Driver, payload.driver_id, "Driver")
    attendance = models.DriverAttendance(**payload.model_dump())
    db.add(attendance)
    commit_or_409(db)
    db.refresh(attendance)
    return attendance


@router.get("/", response_model=list[DriverAttendanceRead])
def list_driver_attendance(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """View Driver Attendance Records (Task 2)"""
    return db.query(models.DriverAttendance).offset(skip).limit(limit).all()


@router.get("/driver/{driver_id}", response_model=list[DriverAttendanceRead])
def list_driver_attendance_by_driver(driver_id: int, db: Session = Depends(get_db)):
    """Get Attendance Records for Specific Driver"""
    get_or_404(db, models.Driver, driver_id, "Driver")
    return db.query(models.DriverAttendance).filter(models.DriverAttendance.driver_id == driver_id).all()


@router.get("/{item_id}", response_model=DriverAttendanceRead)
def get_driver_attendance(item_id: int, db: Session = Depends(get_db)):
    """Get Attendance Record by ID"""
    return get_or_404(db, models.DriverAttendance, item_id, "DriverAttendance")


@router.put("/{item_id}", response_model=DriverAttendanceRead)
def update_driver_attendance(
    item_id: int, payload: DriverAttendanceUpdate, db: Session = Depends(get_db)
):
    """Update Attendance Record"""
    attendance = get_or_404(db, models.DriverAttendance, item_id, "DriverAttendance")
    data = payload.model_dump(exclude_unset=True)

    if "driver_id" in data:
        get_or_404(db, models.Driver, data["driver_id"], "Driver")

    for field, value in data.items():
        setattr(attendance, field, value)

    commit_or_409(db)
    db.refresh(attendance)
    return attendance


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver_attendance(item_id: int, db: Session = Depends(get_db)):
    """Delete Attendance Record"""
    attendance = get_or_404(db, models.DriverAttendance, item_id, "DriverAttendance")
    db.delete(attendance)
    commit_or_409(db)
    return None
