from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.driver_attendance import (
    DriverAttendanceCreate,
    DriverAttendanceUpdate,
    DriverAttendanceResponse
)

from app.services import driver_attendance as attendance_service

from app.auth.oauth2 import get_current_admin


router = APIRouter(
    prefix="/driver-attendance",
    tags=["Driver Attendance"]
)


@router.post(
    "/",
    response_model=DriverAttendanceResponse
)
def create_driver_attendance(
    attendance: DriverAttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    try:
        return attendance_service.create_attendance(
            db,
            attendance
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=list[DriverAttendanceResponse]
)
def get_driver_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    return attendance_service.get_all_attendance(db)


@router.get(
    "/{attendance_id}",
    response_model=DriverAttendanceResponse
)
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    attendance = attendance_service.get_attendance_by_id(
        db,
        attendance_id
    )

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    return attendance


@router.put(
    "/{attendance_id}",
    response_model=DriverAttendanceResponse
)
def update_driver_attendance(
    attendance_id: int,
    attendance: DriverAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    try:
        updated = attendance_service.update_attendance(
            db,
            attendance_id,
            attendance
        )

        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Attendance record not found"
            )

        return updated

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.delete("/{attendance_id}")
def delete_driver_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):

    deleted = attendance_service.delete_attendance(
        db,
        attendance_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    return {
        "message": "Attendance record deleted successfully"
    }