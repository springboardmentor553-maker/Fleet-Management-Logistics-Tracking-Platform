#!/usr/bin/env python3
"""
fix_consistency.py — Makes all FleetFlow data logically consistent.

Rules enforced:
  1. A driver can only be in ONE in-progress trip at a time.
     → Extra IN_PROGRESS trips for same driver are CANCELLED.
  2. A vehicle can only be in ONE in-progress trip at a time.
     → Extra IN_PROGRESS trips for same vehicle are CANCELLED.
  3. All driver statuses synced from their current trip:
     - Has an IN_PROGRESS trip  → ON_DUTY
     - No IN_PROGRESS trip      → AVAILABLE
  4. All vehicle statuses synced from their current trip:
     - Has an IN_PROGRESS trip  → IN_USE
     - Has IN_PROGRESS maintenance (no trip) → MAINTENANCE
     - Otherwise               → AVAILABLE
  5. Driver assignments synced with trip reality:
     - ACTIVE assignments whose driver is not ON_DUTY → COMPLETED
  6. Attendance records — ensure at least 1 record per driver for today.
     Fills gaps so the dashboard "today" summary is meaningful.

Run from project root:
  source .venv/bin/activate
  python3 fix_consistency.py
"""

import sys, os, random
from datetime import datetime, date, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "FleetFlow", "backend"))

from app.database import SessionLocal
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.maintenance import MaintenanceRecord
from app.models.driver_assignment import DriverAssignment
from app.models.driver_attendance import DriverAttendance
from app.models.enums import (
    DriverStatusEnum, VehicleStatusEnum, TripStatusEnum,
    MaintenanceStatusEnum, AssignmentStatusEnum, AttendanceStatusEnum,
)

G = "\033[92m"; Y = "\033[93m"; R = "\033[91m"; C = "\033[96m"; B = "\033[1m"; X = "\033[0m"
def ok(m):   print(f"  {G}✓{X}  {m}")
def warn(m): print(f"  {Y}⚠{X}  {m}")
def fix(m):  print(f"  {R}→{X}  {m}")
def head(m): print(f"\n{B}{C}── {m} {'─'*max(0,55-len(m))}{X}")

db = SessionLocal()
now = datetime.now(timezone.utc)

# ─────────────────────────────────────────────────────────────────────────────
# Step 1 — Resolve duplicate IN_PROGRESS trips for same driver/vehicle
# ─────────────────────────────────────────────────────────────────────────────
head("Step 1 — Resolve duplicate IN_PROGRESS trips")

ip_trips = db.query(Trip).filter(Trip.status == TripStatusEnum.IN_PROGRESS).all()

# Group by driver_id
from collections import defaultdict
by_driver  = defaultdict(list)
by_vehicle = defaultdict(list)
for t in ip_trips:
    by_driver[t.driver_id].append(t)
    by_vehicle[t.vehicle_id].append(t)

cancelled_ids = set()

for driver_id, trips in by_driver.items():
    if len(trips) > 1:
        # Keep the most recently started one; cancel the rest
        trips.sort(key=lambda t: t.scheduled_start_time or now, reverse=True)
        for t in trips[1:]:
            if t.id not in cancelled_ids:
                t.status = TripStatusEnum.CANCELLED
                cancelled_ids.add(t.id)
                fix(f"Driver #{driver_id}: cancelled duplicate IN_PROGRESS trip #{t.id}")

for vehicle_id, trips in by_vehicle.items():
    if len(trips) > 1:
        trips.sort(key=lambda t: t.scheduled_start_time or now, reverse=True)
        for t in trips[1:]:
            if t.id not in cancelled_ids:
                t.status = TripStatusEnum.CANCELLED
                cancelled_ids.add(t.id)
                fix(f"Vehicle #{vehicle_id}: cancelled duplicate IN_PROGRESS trip #{t.id}")

db.commit()
ok(f"Cancelled {len(cancelled_ids)} duplicate trip(s)")

# ─────────────────────────────────────────────────────────────────────────────
# Step 2 — Sync ALL driver statuses from trips
# ─────────────────────────────────────────────────────────────────────────────
head("Step 2 — Sync driver statuses from IN_PROGRESS trips")

# Reload after cancellations
ip_trips = db.query(Trip).filter(Trip.status == TripStatusEnum.IN_PROGRESS).all()
drivers_on_duty = {t.driver_id for t in ip_trips}

all_drivers = db.query(Driver).all()
driver_changes = 0

for d in all_drivers:
    expected = DriverStatusEnum.ON_DUTY if d.id in drivers_on_duty else DriverStatusEnum.AVAILABLE
    if d.status != expected:
        fix(f"Driver #{d.id}: {d.status.value} → {expected.value}")
        d.status = expected
        driver_changes += 1
    else:
        ok(f"Driver #{d.id}: {d.status.value} ✓")

db.commit()
print(f"\n  {driver_changes} driver status(es) corrected")

# ─────────────────────────────────────────────────────────────────────────────
# Step 3 — Sync ALL vehicle statuses from trips + maintenance
# ─────────────────────────────────────────────────────────────────────────────
head("Step 3 — Sync vehicle statuses from trips & maintenance")

vehicles_in_use = {t.vehicle_id for t in ip_trips}

# Vehicles with an IN_PROGRESS maintenance record (and not IN_USE)
maint_vehicles = {
    m.vehicle_id
    for m in db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.status == MaintenanceStatusEnum.IN_PROGRESS)
        .all()
    if m.vehicle_id not in vehicles_in_use
}

all_vehicles = db.query(Vehicle).all()
vehicle_changes = 0

for v in all_vehicles:
    if v.id in vehicles_in_use:
        expected = VehicleStatusEnum.IN_USE
    elif v.id in maint_vehicles:
        expected = VehicleStatusEnum.MAINTENANCE
    else:
        expected = VehicleStatusEnum.AVAILABLE

    if v.current_status != expected:
        fix(f"Vehicle {v.registration_number}: {v.current_status.value} → {expected.value}")
        v.current_status = expected
        vehicle_changes += 1
    else:
        ok(f"Vehicle {v.registration_number}: {v.current_status.value} ✓")

db.commit()
print(f"\n  {vehicle_changes} vehicle status(es) corrected")

# ─────────────────────────────────────────────────────────────────────────────
# Step 4 — Sync driver assignments with actual driver statuses
# ─────────────────────────────────────────────────────────────────────────────
head("Step 4 — Sync driver assignments with trip reality")

active_asgns = db.query(DriverAssignment)\
    .filter(DriverAssignment.status == AssignmentStatusEnum.ACTIVE).all()

asgn_changes = 0
for a in active_asgns:
    drv = db.get(Driver, a.driver_id)
    if drv and drv.status != DriverStatusEnum.ON_DUTY:
        fix(f"Assignment #{a.id}: ACTIVE but Driver #{a.driver_id} is AVAILABLE → set COMPLETED")
        a.status = AssignmentStatusEnum.COMPLETED
        asgn_changes += 1
    else:
        ok(f"Assignment #{a.id}: ACTIVE, Driver #{a.driver_id} ON_DUTY ✓")

db.commit()
print(f"\n  {asgn_changes} assignment(s) corrected")

# ─────────────────────────────────────────────────────────────────────────────
# Step 5 — Ensure every driver has at least one attendance record in last 7 days
#          (makes the dashboard "today" count meaningful)
# ─────────────────────────────────────────────────────────────────────────────
head("Step 5 — Fill attendance gaps (last 7 days)")

today = date.today()
existing_pairs = {
    (r.driver_id, r.date)
    for r in db.query(DriverAttendance).all()
}

all_drivers = db.query(Driver).all()
att_added = 0

# For each driver, ensure at least today's record exists
for d in all_drivers:
    for days_ago in [0, 1, 2]:  # today + last 2 days
        check_date = today - timedelta(days=days_ago)
        pair = (d.id, check_date)
        if pair in existing_pairs:
            continue

        # ON_DUTY drivers are PRESENT today
        if days_ago == 0 and d.status == DriverStatusEnum.ON_DUTY:
            st = AttendanceStatusEnum.PRESENT
        else:
            # Weighted random for historical
            st = random.choices(
                [AttendanceStatusEnum.PRESENT, AttendanceStatusEnum.ABSENT, AttendanceStatusEnum.LEAVE],
                weights=[75, 15, 10]
            )[0]

        if st == AttendanceStatusEnum.PRESENT:
            hour_in  = random.randint(7, 9)
            hour_out = hour_in + random.randint(8, 10)
            cin  = datetime.combine(check_date, datetime.min.time()).replace(tzinfo=timezone.utc) \
                   + timedelta(hours=hour_in,  minutes=random.randint(0, 59))
            cout = datetime.combine(check_date, datetime.min.time()).replace(tzinfo=timezone.utc) \
                   + timedelta(hours=hour_out, minutes=random.randint(0, 59))
        else:
            cin = cout = None

        rec = DriverAttendance(
            driver_id=d.id,
            date=check_date,
            status=st,
            check_in_time=cin,
            check_out_time=cout,
        )
        db.add(rec)
        db.flush()
        existing_pairs.add(pair)
        att_added += 1
        ok(f"Attendance: Driver #{d.id} | {check_date} [{st.value}]")

db.commit()
print(f"\n  {att_added} attendance record(s) added")

# ─────────────────────────────────────────────────────────────────────────────
# Step 6 — Link orphan trips to shipments (trips that have no shipment_id)
#           and assign reasonable statuses to shipments based on trip status
# ─────────────────────────────────────────────────────────────────────────────
head("Step 6 — Verify trip→shipment→driver logical chain")

from app.models.shipment import Shipment
from app.models.enums import ShipmentStatusEnum

# For IN_PROGRESS trips → their shipment should be IN_TRANSIT or similar (not CREATED/CANCELLED)
ACTIVE_SHIP_STATUSES = {
    ShipmentStatusEnum.ASSIGNED,
    ShipmentStatusEnum.PICKED_UP,
    ShipmentStatusEnum.IN_TRANSIT,
    ShipmentStatusEnum.OUT_FOR_DELIVERY,
}
DONE_SHIP_STATUSES = {ShipmentStatusEnum.DELIVERED, ShipmentStatusEnum.CANCELLED}

ship_fixes = 0
for t in db.query(Trip).filter(Trip.status == TripStatusEnum.IN_PROGRESS).all():
    if t.shipment_id:
        s = db.get(Shipment, t.shipment_id)
        if s and s.status not in ACTIVE_SHIP_STATUSES:
            old = s.status.value
            s.status = ShipmentStatusEnum.IN_TRANSIT
            s.driver_id  = t.driver_id
            s.vehicle_id = t.vehicle_id
            fix(f"Shipment #{s.id}: {old} → IN_TRANSIT (matched to IN_PROGRESS trip #{t.id})")
            ship_fixes += 1

for t in db.query(Trip).filter(Trip.status == TripStatusEnum.COMPLETED).all():
    if t.shipment_id:
        s = db.get(Shipment, t.shipment_id)
        if s and s.status not in DONE_SHIP_STATUSES:
            old = s.status.value
            s.status = ShipmentStatusEnum.DELIVERED
            fix(f"Shipment #{s.id}: {old} → DELIVERED (matched to COMPLETED trip #{t.id})")
            ship_fixes += 1

for t in db.query(Trip).filter(Trip.status == TripStatusEnum.CANCELLED).all():
    if t.shipment_id:
        s = db.get(Shipment, t.shipment_id)
        if s and s.status == ShipmentStatusEnum.IN_TRANSIT:
            s.status = ShipmentStatusEnum.CANCELLED
            fix(f"Shipment #{s.id}: IN_TRANSIT → CANCELLED (trip #{t.id} cancelled)")
            ship_fixes += 1

db.commit()
print(f"\n  {ship_fixes} shipment status(es) corrected")

# ─────────────────────────────────────────────────────────────────────────────
# Final summary
# ─────────────────────────────────────────────────────────────────────────────
from sqlalchemy import func

db2 = SessionLocal()

def dist(model, col):
    return db2.query(col, func.count()).group_by(col).all()

d_dist = dist(Driver,  Driver.status)
v_dist = dist(Vehicle, Vehicle.current_status)
t_dist = dist(Trip,    Trip.status)
a_dist = dist(DriverAssignment, DriverAssignment.status)

print(f"\n{'='*65}")
print(f"  {B}✅  Consistency fix complete!{X}")
print(f"{'='*65}")
print(f"\n  {'TABLE':<22} {'STATUS':<20} {'COUNT':>5}")
print(f"  {'-'*50}")
for s, c in d_dist: print(f"  {'Drivers':<22} {s.value:<20} {c:>5}")
print(f"  {'-'*50}")
for s, c in v_dist: print(f"  {'Vehicles':<22} {s.value:<20} {c:>5}")
print(f"  {'-'*50}")
for s, c in t_dist: print(f"  {'Trips':<22} {s.value:<20} {c:>5}")
print(f"  {'-'*50}")
for s, c in a_dist: print(f"  {'Assignments':<22} {s.value:<20} {c:>5}")
print(f"\n  Attendance records  : {db2.query(DriverAttendance).count()}")
print(f"{'='*65}")

db2.close()
db.close()
sys.exit(0)
