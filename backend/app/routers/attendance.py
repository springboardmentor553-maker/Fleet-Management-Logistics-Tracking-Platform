from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.driver_attendance import DriverAttendance
from app.models.driver import Driver
from app.models.user import UserRole
from app.schemas.attendance import DriverAttendanceCreate, DriverAttendanceUpdate, DriverAttendanceResponse
from app.utils.dependencies import get_current_active_user, RoleChecker, require_admin, require_manager, require_dispatcher, require_driver_or_higher

router = APIRouter(
    prefix="/attendance",
    tags=["Driver Attendance"]
)

@router.post("", response_model=DriverAttendanceResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_manager)])
def create_attendance(attendance: DriverAttendanceCreate, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == attendance.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    # Check if attendance for this date already exists
    if attendance.date:
        existing = db.query(DriverAttendance).filter(
            DriverAttendance.driver_id == attendance.driver_id,
            DriverAttendance.date == attendance.date
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Attendance already recorded for {attendance.date}")

    new_attendance = DriverAttendance(**attendance.model_dump())
    db.add(new_attendance)
    
    # Sync driver status based on attendance
    from app.models.driver_attendance import AttendanceStatus
    from app.models.driver import DriverStatus
    
    if new_attendance.attendance_status in [AttendanceStatus.ABSENT, AttendanceStatus.LEAVE]:
        driver.status = DriverStatus.OFF_DUTY
    elif new_attendance.attendance_status == AttendanceStatus.PRESENT and driver.status != DriverStatus.ON_TRIP:
        driver.status = DriverStatus.AVAILABLE
    
    db.commit()
    db.refresh(new_attendance)
    
    res = DriverAttendanceResponse.model_validate(new_attendance)
    if new_attendance.driver and new_attendance.driver.user:
        res.driver_name = new_attendance.driver.user.full_name
    return res

@router.get("", response_model=List[DriverAttendanceResponse], dependencies=[Depends(require_driver_or_higher)])
def get_attendances(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    query = db.query(DriverAttendance)
    
    if current_user.role == UserRole.DRIVER:
        driver_profile = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver_profile:
            return []
        query = query.filter(DriverAttendance.driver_id == driver_profile.id)
        
    records = query.order_by(DriverAttendance.date.desc()).all()
    results = []
    for r in records:
        resp = DriverAttendanceResponse.model_validate(r)
        if r.driver and r.driver.user:
            resp.driver_name = r.driver.user.full_name
        results.append(resp)
    return results

@router.get("/{id}", response_model=DriverAttendanceResponse, dependencies=[Depends(require_driver_or_higher)])
def get_attendance(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    attendance = db.query(DriverAttendance).filter(DriverAttendance.id == id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    if current_user.role == UserRole.DRIVER:
        driver_profile = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver_profile or attendance.driver_id != driver_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this record")
            
    res = DriverAttendanceResponse.model_validate(attendance)
    if attendance.driver and attendance.driver.user:
        res.driver_name = attendance.driver.user.full_name
    return res

@router.put("/{id}", response_model=DriverAttendanceResponse, dependencies=[Depends(require_manager)])
def update_attendance(id: int, attendance_update: DriverAttendanceUpdate, db: Session = Depends(get_db)):
    attendance = db.query(DriverAttendance).filter(DriverAttendance.id == id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    for key, value in attendance_update.model_dump(exclude_unset=True).items():
        setattr(attendance, key, value)
        
    # Sync driver status based on attendance
    from app.models.driver_attendance import AttendanceStatus
    from app.models.driver import DriverStatus
    
    driver = attendance.driver
    if driver:
        if attendance.attendance_status in [AttendanceStatus.ABSENT, AttendanceStatus.LEAVE]:
            driver.status = DriverStatus.OFF_DUTY
        elif attendance.attendance_status == AttendanceStatus.PRESENT and driver.status != DriverStatus.ON_TRIP:
            driver.status = DriverStatus.AVAILABLE
        
    db.commit()
    db.refresh(attendance)
    
    res = DriverAttendanceResponse.model_validate(attendance)
    if attendance.driver and attendance.driver.user:
        res.driver_name = attendance.driver.user.full_name
    return res

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_attendance(id: int, db: Session = Depends(get_db)):
    attendance = db.query(DriverAttendance).filter(DriverAttendance.id == id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    db.delete(attendance)
    db.commit()
    return None
