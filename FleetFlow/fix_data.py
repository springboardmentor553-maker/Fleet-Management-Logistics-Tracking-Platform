import os
import sys
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.abspath("backend"))

from app.database import Base, engine, SessionLocal
from app.models.driver import Driver, DriverStatusEnum
from app.models.vehicle import Vehicle, VehicleStatusEnum
from app.models.trip import Trip, TripStatusEnum
from app.models.shipment import Shipment, ShipmentStatusEnum
from app.models.fuel_record import FuelRecord
from app.models.driver_assignment import DriverAssignment
from app.models.driver_attendance import DriverAttendance, AttendanceStatusEnum
from app.models.maintenance import MaintenanceRecord, MaintenanceStatusEnum

db = SessionLocal()

# 1. Update Drivers to ON_DUTY if they have active trips or just randomly set some.
drivers = db.query(Driver).all()
trips = db.query(Trip).all()
vehicles = db.query(Vehicle).all()

active_drivers = set()
for t in trips:
    if t.status == TripStatusEnum.IN_PROGRESS and t.driver_id:
        active_drivers.add(t.driver_id)

for d in drivers:
    if d.id in active_drivers:
        d.status = DriverStatusEnum.ON_DUTY
    else:
        # Also set some to ON_DUTY randomly just to have enough
        if random.random() < 0.3:
            d.status = DriverStatusEnum.ON_DUTY

# 2. Fix Maintenance Records
maint_vehicles = db.query(Vehicle).filter(Vehicle.current_status == VehicleStatusEnum.MAINTENANCE).all()
maint_records = db.query(MaintenanceRecord).all()
maint_v_ids = {m.vehicle_id for m in maint_records}

for v in maint_vehicles:
    if v.id not in maint_v_ids:
        rec = MaintenanceRecord(
            vehicle_id=v.id,
            service_date=datetime.utcnow() - timedelta(days=random.randint(1, 10)),
            description="Routine scheduled maintenance",
            cost=random.uniform(500, 5000),
            status=MaintenanceStatusEnum.IN_PROGRESS
        )
        db.add(rec)

# 3. Mark Attendance for Drivers based on Trips
for t in trips:
    if not t.driver_id or not t.scheduled_start_time:
        continue
    # trip dates
    date_val = t.scheduled_start_time.date()
    # Check if attendance already exists
    existing = db.query(DriverAttendance).filter_by(driver_id=t.driver_id, date=date_val).first()
    if not existing:
        att = DriverAttendance(
            driver_id=t.driver_id,
            date=date_val,
            status=AttendanceStatusEnum.PRESENT,
            check_in_time=t.scheduled_start_time,
            check_out_time=t.scheduled_end_time if t.scheduled_end_time else t.scheduled_start_time + timedelta(hours=8)
        )
        db.add(att)

# 4. Driver Assignments
assignments_count = db.query(DriverAssignment).count()
if assignments_count < 50:
    for i in range(50 - assignments_count):
        v = random.choice(vehicles)
        d = random.choice(drivers)
        ass = DriverAssignment(
            driver_id=d.id,
            vehicle_id=v.id,
            assignment_date=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            end_date=datetime.utcnow() + timedelta(days=random.randint(10, 60))
        )
        db.add(ass)

# 5. Fix Fuel Logs
fuel_logs = db.query(FuelRecord).all()
fuel_count = len(fuel_logs)

# update existing
for f in fuel_logs:
    f.fuel_cost = f.fuel_quantity * 95.0
    if not f.driver_id:
        f.driver_id = random.choice(drivers).id

# create more if needed
if fuel_count < 50:
    for i in range(50 - fuel_count):
        v = random.choice(vehicles)
        d = random.choice(drivers)
        qty = random.uniform(20.0, 150.0)
        rec = FuelRecord(
            vehicle_id=v.id,
            driver_id=d.id,
            fuel_quantity=qty,
            fuel_cost=qty * 95.0,
            odometer_reading=random.uniform(10000, 50000),
            fuel_date=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            fuel_station=random.choice(["Shell", "BP", "IndianOil", "Reliance"]),
            remarks="Routine fill up"
        )
        db.add(rec)

db.commit()
print("Data fixed!")
