from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.user import User
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.driver_extended import DriverAttendance, DriverActivityLog
from app.schemas.driver import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
    DriverAttendanceCreate,
    DriverAttendanceResponse,
    DriverActivityLogResponse,
    DriverAnalyticsResponse,
)
from app.services.driver import get_all_drivers, get_driver_by_id, create_driver, update_driver, delete_driver
from app.services.notification_service import notify_event, notify_driver_event

router = APIRouter(prefix="/drivers", tags=["Drivers"])

_mgmt = require_roles(Role.ADMIN, Role.FLEET_MANAGER, Role.DISPATCHER)


@router.get("/manage/analytics", response_model=DriverAnalyticsResponse)
def get_driver_analytics(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    drivers = db.query(Driver).all()
    total = len(drivers)
    active = len([d for d in drivers if not d.is_available])
    present = len([d for d in drivers if d.attendance_status == "present"])
    on_leave = len([d for d in drivers if d.attendance_status == "on_leave"])
    absent = len([d for d in drivers if d.attendance_status == "absent"])

    scores = [d.safety_score for d in drivers if d.safety_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 95.0

    completed_trips = sum([d.completed_trips_count or 0 for d in drivers])

    top_driver = None
    if drivers:
        sorted_drivers = sorted(drivers, key=lambda x: (x.rating or 0, x.completed_trips_count or 0), reverse=True)
        top_driver = sorted_drivers[0].name

    return DriverAnalyticsResponse(
        total_drivers=total,
        active_drivers=active,
        present_today=present,
        on_leave=on_leave,
        absent=absent,
        avg_safety_score=avg_score,
        total_completed_trips=completed_trips,
        top_performing_driver=top_driver,
    )


import math

def _haversine_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return 0.0
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_driver_performance(driver_id: int, db: Session):
    from app.models.trip import Trip
    from app.models.shipment import Shipment
    from app.services.maps import geocode_location

    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    trips = db.query(Trip).filter(Trip.driver_id == driver_id).all()
    completed_trips_list = [t for t in trips if t.status == "completed"]

    shipments = db.query(Shipment).filter(Shipment.driver_id == driver_id).all()
    delivered_shipments = [s for s in shipments if s.status in ["delivered", "completed"]]

    total_trips = max(len(trips), len(shipments))
    completed_count = max(len(completed_trips_list), len(delivered_shipments))

    total_km = 0.0
    processed_shipment_ids = set()

    # 1. Process Trips
    for t in completed_trips_list:
        trip_dist = 0.0
        if t.shipment_id:
            processed_shipment_ids.add(t.shipment_id)

        # Tier 1: Direct coordinates on Trip
        if t.pickup_latitude is not None and t.destination_latitude is not None:
            trip_dist = _haversine_km(t.pickup_latitude, t.pickup_longitude, t.destination_latitude, t.destination_longitude)
        # Tier 2: Direct coordinates on Shipment
        elif t.shipment and t.shipment.origin_lat is not None and t.shipment.destination_lat is not None:
            trip_dist = _haversine_km(t.shipment.origin_lat, t.shipment.origin_lng, t.shipment.destination_lat, t.shipment.destination_lng)
        # Tier 3: Geocoding location strings
        elif t.shipment and t.shipment.origin and t.shipment.destination:
            try:
                p_geo = geocode_location(t.shipment.origin)
                d_geo = geocode_location(t.shipment.destination)
                if p_geo and d_geo and p_geo.get("latitude") is not None and d_geo.get("latitude") is not None:
                    lat1, lon1 = p_geo["latitude"], p_geo["longitude"]
                    lat2, lon2 = d_geo["latitude"], d_geo["longitude"]
                    trip_dist = _haversine_km(lat1, lon1, lat2, lon2)
                    t.pickup_latitude = lat1
                    t.pickup_longitude = lon1
                    t.destination_latitude = lat2
                    t.destination_longitude = lon2
            except Exception:
                pass

        total_km += trip_dist

    # 2. Process Delivered Shipments not already counted via Trip
    for s in delivered_shipments:
        if s.id in processed_shipment_ids:
            continue
        shipment_dist = 0.0
        if s.origin_lat is not None and s.destination_lat is not None:
            shipment_dist = _haversine_km(s.origin_lat, s.origin_lng, s.destination_lat, s.destination_lng)
        elif s.origin and s.destination:
            try:
                p_geo = geocode_location(s.origin)
                d_geo = geocode_location(s.destination)
                if p_geo and d_geo and p_geo.get("latitude") is not None and d_geo.get("latitude") is not None:
                    lat1, lon1 = p_geo["latitude"], p_geo["longitude"]
                    lat2, lon2 = d_geo["latitude"], d_geo["longitude"]
                    shipment_dist = _haversine_km(lat1, lon1, lat2, lon2)
                    s.origin_lat = lat1
                    s.origin_lng = lon1
                    s.destination_lat = lat2
                    s.destination_lng = lon2
            except Exception:
                pass
        total_km += shipment_dist

    total_km_rounded = round(total_km, 1)

    driver.completed_trips_count = completed_count
    driver.total_distance_km = total_km_rounded
    try:
        db.commit()
    except Exception:
        db.rollback()

    return {
        "driver_id": driver_id,
        "driver_name": driver.name,
        "total_trips": total_trips,
        "completed_trips": completed_count,
        "total_kilometers": total_km_rounded,
    }


@router.get("/", response_model=list[DriverResponse])
def list_drivers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    raw_drivers = get_all_drivers(db)
    for d in raw_drivers:
        calculate_driver_performance(d.id, db)
    # Expire session identity map so next query reads fresh committed values from DB
    db.expire_all()
    return get_all_drivers(db)


@router.get("/{driver_id}/performance")
def get_driver_performance_route(driver_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return calculate_driver_performance(driver_id, db)


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    calculate_driver_performance(driver_id, db)
    db.expire_all()
    return get_driver_by_id(driver_id, db)


@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def add_driver(data: DriverCreate, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    driver = create_driver(data, db)
    # Log driver registration activity
    log = DriverActivityLog(
        driver_id=driver.id,
        action="Driver Registered",
        details=f"Registered driver {driver.name} (License: {driver.license_number})",
    )
    db.add(log)
    db.commit()
    return driver


@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver_route(driver_id: int, data: DriverUpdate, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    driver = update_driver(driver_id, data, db)
    log = DriverActivityLog(
        driver_id=driver.id,
        action="Driver Updated",
        details=f"Updated details for driver {driver.name}",
    )
    db.add(log)
    db.commit()
    return driver


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver_route(driver_id: int, db: Session = Depends(get_db), _: User = Depends(_mgmt)):
    delete_driver(driver_id, db)


@router.post("/{driver_id}/attendance", response_model=DriverAttendanceResponse)
def record_driver_attendance(
    driver_id: int,
    data: DriverAttendanceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    valid_statuses = {"present", "absent", "leave", "on_leave"}
    status_clean = data.status.lower().strip()
    if status_clean not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail="Attendance status must be one of: Present, Absent, Leave"
        )

    normalized_status = "on_leave" if status_clean in ["leave", "on_leave"] else status_clean

    driver.attendance_status = normalized_status

    record = DriverAttendance(
        driver_id=driver_id,
        date=data.date,
        status=normalized_status,
        check_in=data.check_in,
        check_out=data.check_out,
    )

    log = DriverActivityLog(
        driver_id=driver_id,
        action="Attendance Marked",
        details=f"Marked {driver.name} as {data.status.upper()} for {data.date}",
    )

    db.add(record)
    db.add(log)
    db.commit()
    db.refresh(record)

    if normalized_status in ["absent", "on_leave"]:
        notify_event(
            db=db,
            title=f"Driver Status: {driver.name} is {normalized_status.replace('_', ' ').title()}",
            message=f"Driver '{driver.name}' marked as {normalized_status.replace('_', ' ')} for {data.date}.",
            category="driver_alert",
            priority="normal" if normalized_status == "on_leave" else "high",
            reference_type="driver",
            reference_id=driver.id,
        )

    return record


@router.get("/{driver_id}/attendance", response_model=List[DriverAttendanceResponse])
def get_driver_attendance_history(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(DriverAttendance)
        .filter(DriverAttendance.driver_id == driver_id)
        .order_by(DriverAttendance.id.desc())
        .all()
    )


@router.get("/{driver_id}/logs", response_model=List[DriverActivityLogResponse])
def get_driver_logs(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(DriverActivityLog)
        .filter(DriverActivityLog.driver_id == driver_id)
        .order_by(DriverActivityLog.id.desc())
        .all()
    )


@router.patch("/{driver_id}/assign-vehicle", response_model=DriverResponse)
def assign_vehicle_to_driver(
    driver_id: int,
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(_mgmt),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    if vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        driver.assigned_vehicle_id = vehicle_id
        vehicle.assigned_driver_id = driver_id
        log_msg = f"Assigned vehicle {vehicle.plate_number} to {driver.name}"
    else:
        driver.assigned_vehicle_id = None
        log_msg = f"Unassigned vehicle from {driver.name}"

    log = DriverActivityLog(
        driver_id=driver_id,
        action="Vehicle Assigned",
        details=log_msg,
    )
    db.add(log)
    db.commit()
    db.refresh(driver)

    notify_driver_event(
        db=db,
        driver=driver,
        title="Driver Vehicle Assignment",
        message=log_msg,
        category="driver_assignment",
        priority="high",
        reference_type="driver",
        reference_id=driver.id,
        channel_email=True,
        channel_sms=True,
    )

    return driver
