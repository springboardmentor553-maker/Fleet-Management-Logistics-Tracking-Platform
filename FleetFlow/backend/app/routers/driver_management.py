"""Driver Assignments, Attendance, and Performance router.

Tasks covered
-------------
Task 3  — Driver Assignment CRUD (Assign / View / Update / Remove)
Task 4  — Automatic driver + vehicle status update on assignment state change
Task 5  — GET /drivers/{driver_id}/performance
Task 6  — Swagger-verifiable endpoints with full validation

Endpoint map
------------
POST   /driver-assignments                           Assign a driver to a trip+vehicle
GET    /driver-assignments                           List all assignments (filter: driver_id, status)
GET    /driver-assignments/{id}                      Get single assignment
PUT    /driver-assignments/{id}                      Update assignment (triggers status sync)
DELETE /driver-assignments/{id}                      Cancel assignment (soft — sets CANCELLED)

POST   /driver-attendance                            Create attendance record
GET    /driver-attendance                            List records (filter: driver_id, date, status)
GET    /driver-attendance/{id}                       Get single record
PUT    /driver-attendance/{id}                       Update attendance record

GET    /drivers/{driver_id}/performance              Performance summary from Trip table
"""

import logging
from datetime import date as DateType

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.driver_assignment import DriverAssignment
from app.models.driver_attendance import DriverAttendance
from app.models.enums import (
    AssignmentStatusEnum,
    AttendanceStatusEnum,
    DriverStatusEnum,
    TripStatusEnum,
    VehicleStatusEnum,
)
from app.models.trip import Trip
from app.models.user import User
from app.models.vehicle import Vehicle
from app.services.security import get_current_user
from app.services.audit import log_audit_event

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas — Assignments
# ─────────────────────────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    driver_id:  int
    vehicle_id: int
    trip_id:    int | None = None
    remarks:    str | None = None


class AssignmentUpdate(BaseModel):
    status:  AssignmentStatusEnum | None = None
    remarks: str | None                  = None


class AssignmentResponse(BaseModel):
    id:              int
    driver_id:       int
    vehicle_id:      int
    trip_id:         int | None
    assignment_date: str
    status:          AssignmentStatusEnum
    remarks:         str | None

    # Derived summaries
    driver_license:        str | None = None
    vehicle_registration:  str | None = None

    model_config = {"from_attributes": True}


def _asgn_to_resp(a: DriverAssignment) -> AssignmentResponse:
    return AssignmentResponse(
        id=a.id,
        driver_id=a.driver_id,
        vehicle_id=a.vehicle_id,
        trip_id=a.trip_id,
        assignment_date=a.assignment_date.isoformat(),
        status=a.status,
        remarks=a.remarks,
        driver_license=a.driver.license_details if a.driver else None,
        vehicle_registration=a.vehicle.registration_number if a.vehicle else None,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Task 4 helper: sync driver + vehicle status from assignment status
# ─────────────────────────────────────────────────────────────────────────────

def _sync_statuses(
    driver: Driver,
    vehicle: Vehicle,
    new_asgn_status: AssignmentStatusEnum,
    db: Session,
) -> None:
    """Update Driver.status and Vehicle.current_status to reflect assignment state.

    Rules:
      ACTIVE     → Driver=ON_DUTY,   Vehicle=IN_USE
      COMPLETED  → Driver=AVAILABLE, Vehicle=AVAILABLE
      CANCELLED  → Driver=AVAILABLE, Vehicle=AVAILABLE
    """
    if new_asgn_status == AssignmentStatusEnum.ACTIVE:
        driver.current_status_val  = DriverStatusEnum.ON_DUTY
        vehicle.current_status     = VehicleStatusEnum.IN_USE
        # Use the model attribute name
        driver.status = DriverStatusEnum.ON_DUTY
        vehicle.current_status = VehicleStatusEnum.IN_USE
    else:
        driver.status = DriverStatusEnum.AVAILABLE
        vehicle.current_status = VehicleStatusEnum.AVAILABLE

    db.flush()
    logger.info(
        "Status sync — driver_id=%s → %s | vehicle_id=%s → %s (assignment=%s)",
        driver.id, driver.status.value,
        vehicle.id, vehicle.current_status.value,
        new_asgn_status.value,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Task 3 — Assignment CRUD
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/driver-assignments",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assign a driver to a vehicle and (optionally) a trip",
    tags=["driver-assignments"],
)
def assign_driver(
    body: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate driver exists
    driver = db.get(Driver, body.driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail=f"Driver id={body.driver_id} not found.")

    # Task 3: Check driver availability
    if driver.status != DriverStatusEnum.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Driver id={body.driver_id} is not available (current status: {driver.status.value}).",
        )

    # Validate vehicle exists
    vehicle = db.get(Vehicle, body.vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail=f"Vehicle id={body.vehicle_id} not found.")

    # Task 3: Check vehicle availability
    if vehicle.current_status != VehicleStatusEnum.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Vehicle id={body.vehicle_id} is not available (current status: {vehicle.current_status.value}).",
        )

    # Validate trip if provided
    if body.trip_id is not None:
        trip = db.get(Trip, body.trip_id)
        if trip is None:
            raise HTTPException(status_code=404, detail=f"Trip id={body.trip_id} not found.")

    asgn = DriverAssignment(
        driver_id=body.driver_id,
        vehicle_id=body.vehicle_id,
        trip_id=body.trip_id,
        remarks=body.remarks,
        status=AssignmentStatusEnum.ACTIVE,
    )
    db.add(asgn)
    db.flush()

    # Task 4: Sync statuses on creation (ACTIVE)
    _sync_statuses(driver, vehicle, AssignmentStatusEnum.ACTIVE, db)

    db.commit()
    db.refresh(asgn)

    log_audit_event(
        db=db,
        action="CREATE",
        resource_type="DriverAssignment",
        resource_id=asgn.id,
        user_id=current_user.id,
        details={"driver_id": body.driver_id, "vehicle_id": body.vehicle_id, "trip_id": body.trip_id}
    )

    logger.info("Assignment id=%s created — driver=%s vehicle=%s", asgn.id, body.driver_id, body.vehicle_id)
    return _asgn_to_resp(asgn)


@router.get(
    "/driver-assignments",
    response_model=list[AssignmentResponse],
    summary="List all driver assignments",
    tags=["driver-assignments"],
)
def list_assignments(
    driver_id:     int | None                  = Query(None),
    status_filter: AssignmentStatusEnum | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(DriverAssignment)
    if driver_id is not None:
        q = q.filter(DriverAssignment.driver_id == driver_id)
    if status_filter is not None:
        q = q.filter(DriverAssignment.status == status_filter)
    return [_asgn_to_resp(a) for a in q.order_by(DriverAssignment.assignment_date.desc()).all()]


@router.get(
    "/driver-assignments/{assignment_id}",
    response_model=AssignmentResponse,
    summary="Get a single driver assignment",
    tags=["driver-assignments"],
)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    asgn = db.get(DriverAssignment, assignment_id)
    if asgn is None:
        raise HTTPException(status_code=404, detail=f"Assignment id={assignment_id} not found.")
    return _asgn_to_resp(asgn)


@router.put(
    "/driver-assignments/{assignment_id}",
    response_model=AssignmentResponse,
    summary="Update a driver assignment (also updates driver/vehicle status)",
    tags=["driver-assignments"],
)
def update_assignment(
    assignment_id: int,
    body: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    asgn = db.get(DriverAssignment, assignment_id)
    if asgn is None:
        raise HTTPException(status_code=404, detail=f"Assignment id={assignment_id} not found.")

    update_data = body.model_dump(exclude_unset=True)
    new_status = update_data.get("status")

    for field, value in update_data.items():
        setattr(asgn, field, value)

    # Task 4: Sync on status change
    if new_status is not None:
        _sync_statuses(asgn.driver, asgn.vehicle, new_status, db)

    db.commit()
    db.refresh(asgn)

    log_audit_event(
        db=db,
        action="UPDATE",
        resource_type="DriverAssignment",
        resource_id=asgn.id,
        user_id=current_user.id,
        details={"updates": update_data}
    )

    return _asgn_to_resp(asgn)


@router.delete(
    "/driver-assignments/{assignment_id}",
    summary="Cancel a driver assignment (sets status=CANCELLED, restores availability)",
    tags=["driver-assignments"],
)
def cancel_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    asgn = db.get(DriverAssignment, assignment_id)
    if asgn is None:
        raise HTTPException(status_code=404, detail=f"Assignment id={assignment_id} not found.")

    if asgn.status == AssignmentStatusEnum.CANCELLED:
        return {"detail": f"Assignment id={assignment_id} is already cancelled."}

    asgn.status = AssignmentStatusEnum.CANCELLED
    _sync_statuses(asgn.driver, asgn.vehicle, AssignmentStatusEnum.CANCELLED, db)
    db.commit()

    log_audit_event(
        db=db,
        action="DELETE",
        resource_type="DriverAssignment",
        resource_id=asgn.id,
        user_id=current_user.id,
        details={"status": "CANCELLED"}
    )

    return {
        "detail": f"Assignment id={assignment_id} cancelled.",
        "driver_status":  asgn.driver.status.value,
        "vehicle_status": asgn.vehicle.current_status.value,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas — Attendance
# ─────────────────────────────────────────────────────────────────────────────

class AttendanceCreate(BaseModel):
    driver_id:      int
    date:           DateType
    status:         AttendanceStatusEnum
    check_in_time:  str | None = Field(None, description="ISO 8601 datetime with timezone")
    check_out_time: str | None = Field(None, description="ISO 8601 datetime with timezone")


class AttendanceUpdate(BaseModel):
    status:         AttendanceStatusEnum | None = None
    check_in_time:  str | None                  = None
    check_out_time: str | None                  = None


class AttendanceResponse(BaseModel):
    id:             int
    driver_id:      int
    date:           str
    status:         AttendanceStatusEnum
    check_in_time:  str | None
    check_out_time: str | None

    model_config = {"from_attributes": True}


def _att_to_resp(a: DriverAttendance) -> AttendanceResponse:
    return AttendanceResponse(
        id=a.id,
        driver_id=a.driver_id,
        date=a.date.isoformat(),
        status=a.status,
        check_in_time=a.check_in_time.isoformat()  if a.check_in_time  else None,
        check_out_time=a.check_out_time.isoformat() if a.check_out_time else None,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Task 2 — Attendance CRUD
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime


def _parse_dt(value: str | None, field: str) -> datetime | None:
    if value is None:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid ISO 8601 datetime for '{field}': {value!r}",
        )


@router.post(
    "/driver-attendance",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a driver attendance record",
    tags=["driver-attendance"],
)
def create_attendance(
    body: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = db.get(Driver, body.driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail=f"Driver id={body.driver_id} not found.")

    # Enforce unique constraint explicitly for cleaner error message
    existing = (
        db.query(DriverAttendance)
        .filter(DriverAttendance.driver_id == body.driver_id, DriverAttendance.date == body.date)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Attendance record for driver_id={body.driver_id} on {body.date} already exists (id={existing.id}).",
        )

    rec = DriverAttendance(
        driver_id=body.driver_id,
        date=body.date,
        status=body.status,
        check_in_time=_parse_dt(body.check_in_time, "check_in_time"),
        check_out_time=_parse_dt(body.check_out_time, "check_out_time"),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return _att_to_resp(rec)


@router.get(
    "/driver-attendance",
    response_model=list[AttendanceResponse],
    summary="List attendance records",
    tags=["driver-attendance"],
)
def list_attendance(
    driver_id:     int | None                   = Query(None),
    date_filter:   DateType | None              = Query(None, alias="date"),
    status_filter: AttendanceStatusEnum | None  = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(DriverAttendance)
    if driver_id is not None:
        q = q.filter(DriverAttendance.driver_id == driver_id)
    if date_filter is not None:
        q = q.filter(DriverAttendance.date == date_filter)
    if status_filter is not None:
        q = q.filter(DriverAttendance.status == status_filter)
    return [_att_to_resp(r) for r in q.order_by(DriverAttendance.date.desc()).all()]


# ── Today-summary helper (server-side date, no timezone ambiguity) ────────────

from datetime import date as DateObj


class AttendanceTodaySummary(BaseModel):
    date:         str
    total:        int
    present:      int
    absent:       int
    on_leave:     int
    not_marked:   int  # drivers with no record today
    total_drivers: int


@router.get(
    "/driver-attendance/today-summary",
    response_model=AttendanceTodaySummary,
    summary="Today's attendance summary (server-side date)",
    tags=["driver-attendance"],
)
def attendance_today_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.driver import Driver  # local import to avoid circular
    today = DateObj.today()
    total_drivers = db.query(Driver).count()

    today_recs = db.query(DriverAttendance).filter(DriverAttendance.date == today).all()
    present  = sum(1 for r in today_recs if r.status == AttendanceStatusEnum.PRESENT)
    absent   = sum(1 for r in today_recs if r.status == AttendanceStatusEnum.ABSENT)
    on_leave = sum(1 for r in today_recs if r.status == AttendanceStatusEnum.LEAVE)
    not_marked = max(0, total_drivers - len(today_recs))

    return AttendanceTodaySummary(
        date=today.isoformat(),
        total=len(today_recs),
        present=present,
        absent=absent,
        on_leave=on_leave,
        not_marked=not_marked,
        total_drivers=total_drivers,
    )


@router.get(
    "/driver-attendance/{record_id}",
    response_model=AttendanceResponse,
    summary="Get a single attendance record",
    tags=["driver-attendance"],
)
def get_attendance(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = db.get(DriverAttendance, record_id)
    if rec is None:
        raise HTTPException(status_code=404, detail=f"Attendance record id={record_id} not found.")
    return _att_to_resp(rec)


@router.put(
    "/driver-attendance/{record_id}",
    response_model=AttendanceResponse,
    summary="Update an attendance record",
    tags=["driver-attendance"],
)
def update_attendance(
    record_id: int,
    body: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = db.get(DriverAttendance, record_id)
    if rec is None:
        raise HTTPException(status_code=404, detail=f"Attendance record id={record_id} not found.")

    update_data = body.model_dump(exclude_unset=True)
    if "check_in_time" in update_data:
        update_data["check_in_time"] = _parse_dt(update_data["check_in_time"], "check_in_time")
    if "check_out_time" in update_data:
        update_data["check_out_time"] = _parse_dt(update_data["check_out_time"], "check_out_time")

    for field, value in update_data.items():
        setattr(rec, field, value)

    db.commit()
    db.refresh(rec)
    return _att_to_resp(rec)


# ─────────────────────────────────────────────────────────────────────────────
# Task 5 — Driver Performance API
# ─────────────────────────────────────────────────────────────────────────────

class DriverPerformanceResponse(BaseModel):
    driver_id:        int
    total_trips:      int
    completed_trips:  int
    active_trips:     int
    cancelled_trips:  int
    completion_rate:  float  # completed / total * 100  (0 if no trips)


@router.get(
    "/drivers/{driver_id}/performance",
    response_model=DriverPerformanceResponse,
    summary="Get driver performance summary (trip counts from Trip table)",
    tags=["driver-performance"],
)
def driver_performance(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail=f"Driver id={driver_id} not found.")

    trips = db.query(Trip).filter(Trip.driver_id == driver_id).all()

    total     = len(trips)
    completed = sum(1 for t in trips if t.status == TripStatusEnum.COMPLETED)
    active    = sum(1 for t in trips if t.status in (TripStatusEnum.IN_PROGRESS, TripStatusEnum.SCHEDULED))
    cancelled = sum(1 for t in trips if t.status == TripStatusEnum.CANCELLED)
    rate      = round(completed / total * 100, 2) if total > 0 else 0.0

    return DriverPerformanceResponse(
        driver_id=driver_id,
        total_trips=total,
        completed_trips=completed,
        active_trips=active,
        cancelled_trips=cancelled,
        completion_rate=rate,
    )
