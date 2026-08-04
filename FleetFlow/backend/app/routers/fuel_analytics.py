"""
Fuel Monitoring + Analytics router.

Routes
------
POST   /fuel                    Add fuel record
GET    /fuel                    List (filter: vehicle_id, driver_id, date)
GET    /fuel/{id}               Get single record
PUT    /fuel/{id}               Update record
DELETE /fuel/{id}               Hard delete (no history meaning here)

GET    /analytics/fuel          Fuel analytics (fully dynamic, never stored)
GET    /analytics/operations    Operational analytics (dynamic)
GET    /dashboard/fleet         Fleet performance dashboard (dynamic)
"""

from __future__ import annotations

from datetime import date as DateType, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.driver_assignment import DriverAssignment
from app.models.driver_attendance import DriverAttendance
from app.models.enums import (
    AssignmentStatusEnum,
    DriverStatusEnum,
    MaintenanceStatusEnum,
    ShipmentStatusEnum,
    TripStatusEnum,
    VehicleStatusEnum,
)
from app.models.fuel_record import FuelRecord
from app.models.maintenance import MaintenanceRecord
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.user import User
from app.models.vehicle import Vehicle
from app.services.security import get_current_user


def get_date_range(time_range: str):
    from datetime import date, timedelta
    import calendar
    today = date.today()
    
    def safe_date(year, month, day):
        last_day = calendar.monthrange(year, month)[1]
        return date(year, month, min(day, last_day))

    if time_range == "last_month":
        first_day_this_month = today.replace(day=1)
        end_date = first_day_this_month - timedelta(days=1)
        start_date = end_date.replace(day=1)
    elif time_range == "last_3_months":
        start_month = today.month - 3
        start_year = today.year
        if start_month <= 0:
            start_month += 12
            start_year -= 1
        start_date = safe_date(start_year, start_month, today.day)
        end_date = today
    elif time_range == "last_6_months":
        start_month = today.month - 6
        start_year = today.year
        if start_month <= 0:
            start_month += 12
            start_year -= 1
        start_date = safe_date(start_year, start_month, today.day)
        end_date = today
    else: # "current_month" default
        start_date = today.replace(day=1)
        end_date = today
        
    return start_date, end_date

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class FuelRecordCreate(BaseModel):
    vehicle_id:       int
    driver_id:        Optional[int]   = None
    fuel_quantity:    float           = Field(..., gt=0, description="Litres, must be > 0")
    fuel_cost:        float           = Field(..., gt=0, description="Cost, must be > 0")
    odometer_reading: Optional[float] = Field(None, ge=0)
    fuel_date:        DateType        = Field(default_factory=DateType.today)
    fuel_station:     Optional[str]   = None
    remarks:          Optional[str]   = None


class FuelRecordUpdate(BaseModel):
    fuel_quantity:    Optional[float]    = Field(None, gt=0)
    fuel_cost:        Optional[float]    = Field(None, gt=0)
    odometer_reading: Optional[float]   = Field(None, ge=0)
    fuel_date:        Optional[DateType] = None
    fuel_station:     Optional[str]     = None
    remarks:          Optional[str]     = None


class FuelRecordResponse(BaseModel):
    id:               int
    vehicle_id:       int
    driver_id:        Optional[int]
    fuel_quantity:    float
    fuel_cost:        float
    odometer_reading: Optional[float]
    fuel_date:        str
    fuel_station:     Optional[str]
    remarks:          Optional[str]
    created_at:       str

    model_config = {"from_attributes": True}


def _to_resp(r: FuelRecord) -> FuelRecordResponse:
    return FuelRecordResponse(
        id=r.id,
        vehicle_id=r.vehicle_id,
        driver_id=r.driver_id,
        fuel_quantity=r.fuel_quantity,
        fuel_cost=r.fuel_cost,
        odometer_reading=r.odometer_reading,
        fuel_date=r.fuel_date.isoformat(),
        fuel_station=r.fuel_station,
        remarks=r.remarks,
        created_at=r.created_at.isoformat(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Task 2 — Fuel CRUD
# ─────────────────────────────────────────────────────────────────────────────

def _get_vehicle_or_404(vehicle_id: int, db: Session) -> Vehicle:
    v = db.get(Vehicle, vehicle_id)
    if v is None:
        raise HTTPException(status_code=404, detail=f"Vehicle id={vehicle_id} not found.")
    return v


def _get_driver_or_404(driver_id: int, db: Session) -> Driver:
    d = db.get(Driver, driver_id)
    if d is None:
        raise HTTPException(status_code=404, detail=f"Driver id={driver_id} not found.")
    return d


@router.post(
    "/fuel",
    response_model=FuelRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a fuel record",
    tags=["fuel"],
)
def create_fuel_record(
    body: FuelRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_vehicle_or_404(body.vehicle_id, db)
    if body.driver_id is not None:
        _get_driver_or_404(body.driver_id, db)
    else:
        # Auto-assign driver based on active assignment
        active_assignment = db.query(DriverAssignment).filter(
            DriverAssignment.vehicle_id == body.vehicle_id,
            DriverAssignment.status == AssignmentStatusEnum.ACTIVE
        ).first()
        if active_assignment:
            body.driver_id = active_assignment.driver_id

    rec = FuelRecord(**body.model_dump())
    # Hardcode fuel cost to 95.0 per litre
    rec.fuel_cost = rec.fuel_quantity * 95.0
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return _to_resp(rec)


@router.get(
    "/fuel",
    response_model=List[FuelRecordResponse],
    summary="List fuel records",
    tags=["fuel"],
)
def list_fuel_records(
    vehicle_id: Optional[int]      = Query(None),
    driver_id:  Optional[int]      = Query(None),
    date_from:  Optional[DateType] = Query(None),
    date_to:    Optional[DateType] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(FuelRecord)
    if vehicle_id: q = q.filter(FuelRecord.vehicle_id == vehicle_id)
    if driver_id:  q = q.filter(FuelRecord.driver_id  == driver_id)
    if date_from:  q = q.filter(FuelRecord.fuel_date  >= date_from)
    if date_to:    q = q.filter(FuelRecord.fuel_date  <= date_to)
    return [_to_resp(r) for r in q.order_by(FuelRecord.fuel_date.desc()).all()]


@router.get(
    "/fuel/{record_id}",
    response_model=FuelRecordResponse,
    summary="Get a single fuel record",
    tags=["fuel"],
)
def get_fuel_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = db.get(FuelRecord, record_id)
    if rec is None:
        raise HTTPException(status_code=404, detail=f"Fuel record id={record_id} not found.")
    return _to_resp(rec)


@router.put(
    "/fuel/{record_id}",
    response_model=FuelRecordResponse,
    summary="Update a fuel record",
    tags=["fuel"],
)
def update_fuel_record(
    record_id: int,
    body: FuelRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = db.get(FuelRecord, record_id)
    if rec is None:
        raise HTTPException(status_code=404, detail=f"Fuel record id={record_id} not found.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rec, field, value)
    
    # Enforce hardcoded fuel cost
    rec.fuel_cost = rec.fuel_quantity * 95.0
    
    db.commit()
    db.refresh(rec)
    return _to_resp(rec)


@router.delete(
    "/fuel/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a fuel record",
    tags=["fuel"],
)
def delete_fuel_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = db.get(FuelRecord, record_id)
    if rec is None:
        raise HTTPException(status_code=404, detail=f"Fuel record id={record_id} not found.")
    db.delete(rec)
    db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Task 3 — Fuel Analytics (100 % dynamic, never stored)
# ─────────────────────────────────────────────────────────────────────────────

class FuelAnalyticsResponse(BaseModel):
    total_records:             int
    total_fuel_consumed_ltrs:  float
    total_fuel_cost:           float
    avg_fuel_per_record_ltrs:  float
    avg_cost_per_litre:        float
    vehicle_highest_usage:     Optional[dict]  # {vehicle_id, registration_number, total_litres}
    vehicle_lowest_usage:      Optional[dict]


@router.get(
    "/analytics/fuel",
    response_model=FuelAnalyticsResponse,
    summary="Fuel analytics (dynamic)",
    tags=["analytics"],
)
def fuel_analytics(
    time_range: str = Query("current_month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = get_date_range(time_range)
    
    # Aggregate per vehicle
    per_vehicle = (
        db.query(
            FuelRecord.vehicle_id,
            func.sum(FuelRecord.fuel_quantity).label("total_qty"),
        )
        .filter(FuelRecord.fuel_date >= start_date, FuelRecord.fuel_date <= end_date)
        .group_by(FuelRecord.vehicle_id)
        .all()
    )

    total_qty  = sum(r.total_qty  for r in per_vehicle) if per_vehicle else 0.0
    total_cost = total_qty * 95.0
    total_recs = db.query(func.count(FuelRecord.id)).filter(FuelRecord.fuel_date >= start_date, FuelRecord.fuel_date <= end_date).scalar() or 0

    highest = lowest = None
    if per_vehicle:
        top = max(per_vehicle, key=lambda r: r.total_qty)
        bot = min(per_vehicle, key=lambda r: r.total_qty)
        v_top = db.get(Vehicle, top.vehicle_id)
        v_bot = db.get(Vehicle, bot.vehicle_id)
        highest = {
            "vehicle_id":           top.vehicle_id,
            "registration_number":  v_top.registration_number if v_top else f"Veh {top.vehicle_id}",
            "total_litres":         round(top.total_qty, 2),
        }
        lowest = {
            "vehicle_id":           bot.vehicle_id,
            "registration_number":  v_bot.registration_number if v_bot else f"Veh {bot.vehicle_id}",
            "total_litres":         round(bot.total_qty, 2),
        }

    return FuelAnalyticsResponse(
        total_records=total_recs,
        total_fuel_consumed_ltrs=round(total_qty, 2),
        total_fuel_cost=round(total_cost, 2),
        avg_fuel_per_record_ltrs=round(total_qty / total_recs, 2) if total_recs else 0.0,
        avg_cost_per_litre=95.0,
        vehicle_highest_usage=highest,
        vehicle_lowest_usage=lowest,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Task 4 — Fleet Performance Dashboard (dynamic)
# ─────────────────────────────────────────────────────────────────────────────

class FleetDashboardResponse(BaseModel):
    # Vehicles
    total_vehicles:        int
    active_vehicles:       int       # IN_USE
    maintenance_vehicles:  int       # MAINTENANCE
    available_vehicles:    int

    # Drivers
    total_drivers:         int
    available_drivers:     int
    on_duty_drivers:       int

    # Trips
    total_trips:           int
    completed_trips:       int
    active_trips:          int       # IN_PROGRESS
    scheduled_trips:       int
    cancelled_trips:       int

    # Shipments
    total_shipments:       int
    active_shipments:      int       # ASSIGNED / PICKED_UP / IN_TRANSIT / OUT_FOR_DELIVERY
    delivered_shipments:   int
    delayed_shipments:     int
    cancelled_shipments:   int

    # Maintenance
    open_maintenance_jobs: int       # SCHEDULED + IN_PROGRESS

    # Fuel summary
    total_fuel_records:    int
    total_fuel_consumed_ltrs: float
    total_fuel_cost:       float


_ACTIVE_SHIP = (
    ShipmentStatusEnum.ASSIGNED,
    ShipmentStatusEnum.PICKED_UP,
    ShipmentStatusEnum.IN_TRANSIT,
    ShipmentStatusEnum.OUT_FOR_DELIVERY,
)


@router.get(
    "/dashboard/fleet",
    response_model=FleetDashboardResponse,
    summary="Fleet performance dashboard (dynamic)",
    tags=["dashboard"],
)
def fleet_dashboard(
    time_range: str = Query("current_month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = get_date_range(time_range)
    
    # ── Vehicles ──────────────────────────────────────────────
    total_v     = db.query(func.count(Vehicle.id)).scalar() or 0
    active_v    = db.query(func.count(Vehicle.id)).filter(Vehicle.current_status == VehicleStatusEnum.IN_USE).scalar() or 0
    maint_v     = db.query(func.count(Vehicle.id)).filter(Vehicle.current_status == VehicleStatusEnum.MAINTENANCE).scalar() or 0
    avail_v     = db.query(func.count(Vehicle.id)).filter(Vehicle.current_status == VehicleStatusEnum.AVAILABLE).scalar() or 0

    # ── Drivers ───────────────────────────────────────────────
    total_d     = db.query(func.count(Driver.id)).scalar() or 0
    avail_d     = db.query(func.count(Driver.id)).filter(Driver.status == DriverStatusEnum.AVAILABLE).scalar() or 0
    on_duty_d   = db.query(func.count(Driver.id)).filter(Driver.status == DriverStatusEnum.ON_DUTY).scalar() or 0

    # ── Trips (Filtered by month) ─────────────────────────────
    total_t      = db.query(func.count(Trip.id)).filter(Trip.created_at >= start_date, Trip.created_at <= end_date).scalar() or 0
    completed_t  = db.query(func.count(Trip.id)).filter(Trip.status == TripStatusEnum.COMPLETED, Trip.created_at >= start_date, Trip.created_at <= end_date).scalar() or 0
    active_t     = db.query(func.count(Trip.id)).filter(Trip.status == TripStatusEnum.IN_PROGRESS, Trip.created_at >= start_date, Trip.created_at <= end_date).scalar() or 0
    scheduled_t  = db.query(func.count(Trip.id)).filter(Trip.status == TripStatusEnum.SCHEDULED, Trip.created_at >= start_date, Trip.created_at <= end_date).scalar() or 0
    cancelled_t  = db.query(func.count(Trip.id)).filter(Trip.status == TripStatusEnum.CANCELLED, Trip.created_at >= start_date, Trip.created_at <= end_date).scalar() or 0

    # ── Shipments (Filtered by month) ─────────────────────────
    total_s     = db.query(func.count(Shipment.id)).filter(Shipment.created_at >= start_date, Shipment.created_at <= end_date).scalar() or 0
    active_s    = db.query(func.count(Shipment.id)).filter(Shipment.status.in_(_ACTIVE_SHIP)).scalar() or 0
    delivered_s = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatusEnum.DELIVERED, Shipment.created_at >= start_date, Shipment.created_at <= end_date).scalar() or 0
    delayed_s   = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatusEnum.DELAYED).scalar() or 0
    cancelled_s = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatusEnum.CANCELLED, Shipment.created_at >= start_date, Shipment.created_at <= end_date).scalar() or 0

    # ── Maintenance ───────────────────────────────────────────
    open_maint  = (
        db.query(func.count(MaintenanceRecord.id))
        .filter(MaintenanceRecord.status.in_([MaintenanceStatusEnum.SCHEDULED, MaintenanceStatusEnum.IN_PROGRESS]))
        .scalar() or 0
    )

    # ── Fuel (Filtered by month) ──────────────────────────────
    fuel_recs   = db.query(func.count(FuelRecord.id)).filter(FuelRecord.fuel_date >= start_date, FuelRecord.fuel_date <= end_date).scalar() or 0
    fuel_qty    = db.query(func.coalesce(func.sum(FuelRecord.fuel_quantity), 0.0)).filter(FuelRecord.fuel_date >= start_date, FuelRecord.fuel_date <= end_date).scalar() or 0.0
    fuel_cost   = float(fuel_qty) * 95.0

    return FleetDashboardResponse(
        total_vehicles=total_v,
        active_vehicles=active_v,
        maintenance_vehicles=maint_v,
        available_vehicles=avail_v,
        total_drivers=total_d,
        available_drivers=avail_d,
        on_duty_drivers=on_duty_d,
        total_trips=total_t,
        completed_trips=completed_t,
        active_trips=active_t,
        scheduled_trips=scheduled_t,
        cancelled_trips=cancelled_t,
        total_shipments=total_s,
        active_shipments=active_s,
        delivered_shipments=delivered_s,
        delayed_shipments=delayed_s,
        cancelled_shipments=cancelled_s,
        open_maintenance_jobs=open_maint,
        total_fuel_records=fuel_recs,
        total_fuel_consumed_ltrs=round(float(fuel_qty), 2),
        total_fuel_cost=round(float(fuel_cost), 2),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Task 5 — Operational Analytics (dynamic)
# ─────────────────────────────────────────────────────────────────────────────

class OperationalAnalyticsResponse(BaseModel):
    # Delivery outcomes
    total_deliveries:        int
    successful_deliveries:   int
    delayed_deliveries:      int
    cancelled_deliveries:    int
    delivery_success_rate:   float   # percent

    # Trip metrics
    total_trips:             int
    avg_trip_distance_km:    Optional[float]   # computed from lat/lng haversine
    avg_trip_duration_hrs:   Optional[float]   # scheduled end - scheduled start

    # Shipment timing
    avg_delivery_time_hrs:   Optional[float]   # scheduled_end - scheduled_start across completed trips

    # Active workload
    active_trips_now:        int
    active_shipments_now:    int


def _haversine(lat1, lng1, lat2, lng2) -> float:
    """Distance in km between two lat/lng points."""
    import math
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi       = math.radians(lat2 - lat1)
    dlambda    = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get(
    "/analytics/operations",
    response_model=OperationalAnalyticsResponse,
    summary="Operational analytics (dynamic)",
    tags=["analytics"],
)
def operations_analytics(
    time_range: str = Query("current_month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = get_date_range(time_range)
    
    # ── Shipment delivery outcomes ────────────────────────────
    total_s     = db.query(func.count(Shipment.id)).filter(Shipment.created_at >= start_date, Shipment.created_at <= end_date).scalar() or 0
    delivered_s = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatusEnum.DELIVERED, Shipment.created_at >= start_date, Shipment.created_at <= end_date).scalar() or 0
    from datetime import datetime, timezone
    delayed_s   = db.query(func.count(Shipment.id)).filter(
        (Shipment.status == ShipmentStatusEnum.DELAYED) | 
        ((Shipment.eta < datetime.now(timezone.utc)) & ~Shipment.status.in_([ShipmentStatusEnum.DELIVERED, ShipmentStatusEnum.CANCELLED]))
    ).scalar() or 0
    cancelled_s = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatusEnum.CANCELLED, Shipment.created_at >= start_date, Shipment.created_at <= end_date).scalar() or 0
    active_s    = db.query(func.count(Shipment.id)).filter(Shipment.status.in_(_ACTIVE_SHIP)).scalar() or 0

    success_rate = round(delivered_s / total_s * 100, 1) if total_s else 0.0

    # ── Trip metrics ──────────────────────────────────────────
    all_trips = db.query(Trip).filter(Trip.created_at >= start_date, Trip.created_at <= end_date).all()
    total_t   = len(all_trips)
    active_t  = sum(1 for t in all_trips if t.status == TripStatusEnum.IN_PROGRESS)

    # Average distance — use haversine on trips that have all 4 coordinates
    distances = []
    for t in all_trips:
        if all(v is not None for v in [t.pickup_lat, t.pickup_lng, t.destination_lat, t.destination_lng]):
            d = _haversine(t.pickup_lat, t.pickup_lng, t.destination_lat, t.destination_lng)
            distances.append(d)
    avg_dist = round(sum(distances) / len(distances), 2) if distances else None

    # Average trip duration — scheduled_end_time minus scheduled_start_time
    durations_hrs = []
    for t in all_trips:
        if t.scheduled_end_time and t.scheduled_start_time:
            delta = (t.scheduled_end_time - t.scheduled_start_time).total_seconds() / 3600
            if delta > 0:
                durations_hrs.append(delta)
    avg_duration = round(sum(durations_hrs) / len(durations_hrs), 2) if durations_hrs else None

    # Average delivery time — same as trip duration but only COMPLETED trips
    completed_trips = [t for t in all_trips if t.status == TripStatusEnum.COMPLETED]
    comp_durations  = []
    for t in completed_trips:
        if t.scheduled_end_time and t.scheduled_start_time:
            delta = (t.scheduled_end_time - t.scheduled_start_time).total_seconds() / 3600
            if delta > 0:
                comp_durations.append(delta)
    avg_delivery_time = round(sum(comp_durations) / len(comp_durations), 2) if comp_durations else None

    return OperationalAnalyticsResponse(
        total_deliveries=total_s,
        successful_deliveries=delivered_s,
        delayed_deliveries=delayed_s,
        cancelled_deliveries=cancelled_s,
        delivery_success_rate=success_rate,
        total_trips=total_t,
        avg_trip_distance_km=avg_dist,
        avg_trip_duration_hrs=avg_duration,
        avg_delivery_time_hrs=avg_delivery_time,
        active_trips_now=active_t,
        active_shipments_now=active_s,
    )
