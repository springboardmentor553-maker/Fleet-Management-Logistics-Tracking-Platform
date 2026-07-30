#!/usr/bin/env python3
"""
bulk_seed.py — Populates all FleetFlow tables with 50+ records each.

Tables targeted (users table is left alone):
  vehicles          → 50 records
  drivers           → 50 records  (re-uses existing users; creates new ones if needed)
  shipments         → 50 records
  trips             → 50 records  (1-to-1 with shipments, UNIQUE constraint)
  maintenance_records → 50 records
  driver_assignments  → 50 records
  driver_attendance   → 50 records (across last 30 days)

Run:
  source .venv/bin/activate
  python3 bulk_seed.py
"""

import sys
import os
import random
from datetime import datetime, timedelta, date, timezone

# ── Path fix ────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "FleetFlow", "backend"))

from app.database import SessionLocal
from app.models.user import User
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.maintenance import MaintenanceRecord
from app.models.driver_assignment import DriverAssignment
from app.models.driver_attendance import DriverAttendance
from app.models.enums import (
    RoleEnum, VehicleStatusEnum, ShipmentStatusEnum, TripStatusEnum,
    MaintenanceCategoryEnum, MaintenanceStatusEnum,
    AssignmentStatusEnum, AttendanceStatusEnum, DriverStatusEnum,
)
from app.services.security import hash_password

# ── Colour output ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def ok(msg):   print(f"  {GREEN}✓{RESET}  {msg}")
def skip(msg): print(f"  {YELLOW}↷{RESET}  {msg}")
def head(msg): print(f"\n{BOLD}{CYAN}── {msg} {'─' * max(0, 55 - len(msg))}{RESET}")

# ── Reference data ────────────────────────────────────────────────────────────

CITIES = [
    ("Mumbai, Maharashtra",     19.0760,  72.8777),
    ("Delhi, NCR",              28.7041,  77.1025),
    ("Bengaluru, Karnataka",    12.9716,  77.5946),
    ("Chennai, Tamil Nadu",     13.0827,  80.2707),
    ("Hyderabad, Telangana",    17.3850,  78.4867),
    ("Ahmedabad, Gujarat",      23.0225,  72.5714),
    ("Pune, Maharashtra",       18.5204,  73.8567),
    ("Kolkata, West Bengal",    22.5726,  88.3639),
    ("Surat, Gujarat",          21.1702,  72.8311),
    ("Jaipur, Rajasthan",       26.9124,  75.7873),
    ("Lucknow, Uttar Pradesh",  26.8467,  80.9462),
    ("Kanpur, Uttar Pradesh",   26.4499,  80.3319),
    ("Nagpur, Maharashtra",     21.1458,  79.0882),
    ("Indore, Madhya Pradesh",  22.7196,  75.8577),
    ("Bhopal, Madhya Pradesh",  23.2599,  77.4126),
    ("Visakhapatnam, AP",       17.6868,  83.2185),
    ("Patna, Bihar",            25.5941,  85.1376),
    ("Chandigarh, Punjab",      30.7333,  76.7794),
    ("Gurgaon, Haryana",        28.4595,  77.0266),
    ("Noida, UP",               28.5355,  77.3910),
    ("Kochi, Kerala",            9.9312,  76.2673),
    ("Coimbatore, Tamil Nadu",  11.0168,  76.9558),
    ("Guwahati, Assam",         26.1445,  91.7362),
    ("Bhubaneswar, Odisha",     20.2961,  85.8245),
    ("Amritsar, Punjab",        31.6340,  74.8723),
]

COMPANIES = [
    "Reliance Industries", "Tata Steel", "Infosys", "Wipro", "HCL Technologies",
    "HDFC Bank", "ICICI Bank", "Mahindra & Mahindra", "Bajaj Auto", "Maruti Suzuki",
    "Sun Pharma", "Dr Reddy Labs", "Cipla", "Dabur India", "Marico India",
    "ITC Limited", "Hindustan Unilever", "Asian Paints", "Berger Paints", "Pidilite",
    "Godrej Consumer", "Britannia Industries", "Nestle India", "Amul Dairy", "Mother Dairy",
    "Zomato Logistics", "Swiggy Warehouse", "Amazon India", "Flipkart", "Meesho",
    "BigBasket", "Grofers", "Nykaa", "Myntra", "Paytm Mall",
    "IndiaMART", "TradeIndia", "Snapdeal", "ShopClues", "PayU India",
]

PROVIDERS = [
    "SpeedServ Auto Works", "QuickFix Garage", "Prime Motors Service",
    "AutoCare Solutions", "FastTrack Maintenance", "TechDrive Services",
    "AllWheels Repair Hub", "Reliable Auto Workshop", "Express Vehicle Care",
    "ProFleet Service Centre",
]

VEHICLE_TYPES = ["Truck", "Mini Truck", "Container Truck", "Pickup Van", "Tempo", "Refrigerator Truck", "Tanker", "Flatbed Truck"]
FUEL_TYPES    = ["Diesel", "Petrol", "CNG", "Electric", "LNG"]
REG_STATES    = ["MH", "DL", "KA", "TN", "TS", "GJ", "RJ", "WB", "UP", "PB", "KL"]

now = datetime.now(timezone.utc)


def rand_city():    return random.choice(CITIES)
def rand_company(): return random.choice(COMPANIES)
def rand_date_past(days=30): return (date.today() - timedelta(days=random.randint(0, days)))
def rand_dt_past(days=30): return now - timedelta(days=random.randint(0, days),
                                                    hours=random.randint(0, 23))

# ── DB Session ────────────────────────────────────────────────────────────────
db = SessionLocal()

# ─────────────────────────────────────────────────────────────────────────────
# 1. VEHICLES — 50 records
# ─────────────────────────────────────────────────────────────────────────────
head("Vehicles (target: 50)")

existing_vehicles = db.query(Vehicle).count()
skip(f"Already have {existing_vehicles} vehicle(s) in DB")

used_regs = {v.registration_number for v in db.query(Vehicle).all()}
created_vehicles = list(db.query(Vehicle).all())

# Managers — pick admin/fleet_manager users to assign
mgr_users = db.query(User).filter(
    User.role.in_([RoleEnum.ADMIN, RoleEnum.FLEET_MANAGER])
).all()
if not mgr_users:
    mgr_users = db.query(User).limit(3).all()

to_add = max(0, 50 - existing_vehicles)
for i in range(to_add):
    state = random.choice(REG_STATES)
    num   = random.randint(10, 99)
    alpha = ''.join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=2))
    seq   = random.randint(1000, 9999)
    reg   = f"{state}{num:02d}{alpha}{seq}"
    while reg in used_regs:
        seq = random.randint(1000, 9999)
        reg = f"{state}{num:02d}{alpha}{seq}"
    used_regs.add(reg)

    v = Vehicle(
        registration_number=reg,
        vehicle_type=random.choice(VEHICLE_TYPES),
        capacity=round(random.uniform(0.5, 30.0), 1),
        fuel_type=random.choice(FUEL_TYPES),
        current_status=VehicleStatusEnum.AVAILABLE,
        manager_id=random.choice(mgr_users).id if mgr_users else None,
    )
    db.add(v)
    db.flush()
    created_vehicles.append(v)
    ok(f"Vehicle {reg} — {v.vehicle_type} ({v.fuel_type})")

db.commit()
created_vehicles = db.query(Vehicle).all()
print(f"  Total vehicles: {len(created_vehicles)}")


# ─────────────────────────────────────────────────────────────────────────────
# 2. DRIVERS — 50 records
# ─────────────────────────────────────────────────────────────────────────────
head("Drivers (target: 50)")

existing_drivers = db.query(Driver).count()
skip(f"Already have {existing_drivers} driver(s) in DB")
created_drivers  = list(db.query(Driver).all())

# We need user accounts for each driver. 
# First collect all user_ids already linked to a driver.
linked_user_ids = {d.user_id for d in created_drivers}

# Also get all driver-role users not yet linked
free_driver_users = db.query(User).filter(
    User.role == RoleEnum.DRIVER,
    ~User.id.in_(linked_user_ids) if linked_user_ids else True
).all()

FIRST = ["Ravi", "Priya", "Arjun", "Neha", "Suresh", "Vikram", "Anita", "Rahul",
         "Pooja", "Sandeep", "Deepak", "Kavya", "Mohan", "Sunita", "Ajay",
         "Meena", "Rohit", "Divya", "Sanjay", "Lakshmi", "Arun", "Geeta",
         "Manoj", "Rekha", "Vinod", "Usha", "Ramesh", "Nirmala", "Sunil", "Puja"]
LAST  = ["Kumar", "Sharma", "Singh", "Verma", "Rao", "Nair", "Patel", "Joshi",
         "Gupta", "Mehta", "Shah", "Reddy", "Pillai", "Mishra", "Tiwari",
         "Chauhan", "Yadav", "Srivastava", "Pandey", "Agarwal"]

to_add = max(0, 50 - existing_drivers)
for i in range(to_add):
    # Create a new user for this driver
    first = random.choice(FIRST)
    last  = random.choice(LAST)
    idx   = i + existing_drivers + 1
    email = f"driver{idx:03d}@fleetflow.in"
    while db.query(User).filter(User.email == email).first():
        idx += 1
        email = f"driver{idx:03d}@fleetflow.in"

    user = User(
        email=email,
        hashed_password=hash_password("FleetFlow@123"),
        role=RoleEnum.DRIVER,
    )
    db.add(user)
    db.flush()

    states = ["DL", "MH", "KA", "TN", "GJ", "UP", "RJ"]
    lic = f"{random.choice(states)}-{random.randint(10,99):02d}-{random.randint(2000,2023)}-{random.randint(100000,999999)}"

    driver = Driver(
        user_id=user.id,
        license_details=lic,
        status=DriverStatusEnum.AVAILABLE,
    )
    db.add(driver)
    db.flush()
    created_drivers.append(driver)
    ok(f"Driver #{driver.id} — {first} {last} | {lic}")

db.commit()
created_drivers = db.query(Driver).all()
print(f"  Total drivers: {len(created_drivers)}")


# ─────────────────────────────────────────────────────────────────────────────
# 3. SHIPMENTS — 50 records
# ─────────────────────────────────────────────────────────────────────────────
head("Shipments (target: 50)")

existing_shipments = db.query(Shipment).count()
skip(f"Already have {existing_shipments} shipment(s) in DB")

used_tracking = {s.tracking_number for s in db.query(Shipment).all()}
created_shipments = list(db.query(Shipment).all())

STATUSES_SHIP = [
    ShipmentStatusEnum.CREATED,
    ShipmentStatusEnum.ASSIGNED,
    ShipmentStatusEnum.PICKED_UP,
    ShipmentStatusEnum.IN_TRANSIT,
    ShipmentStatusEnum.OUT_FOR_DELIVERY,
    ShipmentStatusEnum.DELIVERED,
    ShipmentStatusEnum.DELAYED,
    ShipmentStatusEnum.CANCELLED,
]

to_add = max(0, 50 - existing_shipments)
for i in range(to_add):
    num = existing_shipments + i + 100001
    trk = f"FLT{num}"
    while trk in used_tracking:
        num += 1; trk = f"FLT{num}"
    used_tracking.add(trk)

    pickup_city, _, _ = rand_city()
    delivery_city, _, _ = rand_city()
    while delivery_city == pickup_city:
        delivery_city, _, _ = rand_city()

    st = random.choice(STATUSES_SHIP)
    drv = random.choice(created_drivers) if st not in (ShipmentStatusEnum.CREATED,) else None
    veh = random.choice(created_vehicles) if drv else None
    created_ago = rand_dt_past(60)

    s = Shipment(
        tracking_number=trk,
        sender_name=rand_company(),
        receiver_name=rand_company(),
        pickup_location=pickup_city,
        delivery_location=delivery_city,
        status=st,
        weight=round(random.uniform(10.0, 5000.0), 1),
        created_at=created_ago,
        eta=created_ago + timedelta(days=random.randint(1, 10)),
        driver_id=drv.id if drv else None,
        vehicle_id=veh.id if veh else None,
    )
    db.add(s)
    db.flush()
    created_shipments.append(s)
    ok(f"Shipment {trk} — {pickup_city[:20]} → {delivery_city[:20]} [{st.value}]")

db.commit()
created_shipments = db.query(Shipment).all()
print(f"  Total shipments: {len(created_shipments)}")


# ─────────────────────────────────────────────────────────────────────────────
# 4. TRIPS — 50 records
#    One shipment can have at most one trip (UNIQUE constraint on shipment_id)
# ─────────────────────────────────────────────────────────────────────────────
head("Trips (target: 50)")

existing_trips = db.query(Trip).count()
skip(f"Already have {existing_trips} trip(s) in DB")
created_trips = list(db.query(Trip).all())

# Shipments that don't yet have a trip
linked_shipment_ids = {t.shipment_id for t in created_trips if t.shipment_id}
free_shipments = [s for s in created_shipments if s.id not in linked_shipment_ids]
random.shuffle(free_shipments)

TRIP_STATUSES = [
    TripStatusEnum.SCHEDULED,
    TripStatusEnum.IN_PROGRESS,
    TripStatusEnum.COMPLETED,
    TripStatusEnum.CANCELLED,
]

to_add = max(0, 50 - existing_trips)
used_shipments_this_run = set()

for i in range(to_add):
    # pick a shipment not yet linked
    shipment = None
    for s in free_shipments:
        if s.id not in used_shipments_this_run:
            shipment = s; break

    pickup_city, pu_lat, pu_lng = rand_city()
    dest_city, dst_lat, dst_lng = rand_city()
    while dest_city == pickup_city:
        dest_city, dst_lat, dst_lng = rand_city()

    drv = random.choice(created_drivers)
    veh = random.choice(created_vehicles)
    st  = random.choice(TRIP_STATUSES)
    start = rand_dt_past(60)
    end   = start + timedelta(hours=random.randint(4, 72))

    t = Trip(
        shipment_id=shipment.id if shipment else None,
        driver_id=drv.id,
        vehicle_id=veh.id,
        pickup_location=pickup_city,
        destination=dest_city,
        pickup_lat=pu_lat, pickup_lng=pu_lng,
        destination_lat=dst_lat, destination_lng=dst_lng,
        scheduled_start_time=start,
        scheduled_end_time=end,
        status=st,
        created_at=start,
    )
    db.add(t)
    db.flush()
    created_trips.append(t)

    if shipment:
        used_shipments_this_run.add(shipment.id)
    ok(f"Trip #{t.id} — {pickup_city[:18]} → {dest_city[:18]} [{st.value}]")

db.commit()
created_trips = db.query(Trip).all()
print(f"  Total trips: {len(created_trips)}")


# ─────────────────────────────────────────────────────────────────────────────
# 5. MAINTENANCE RECORDS — 50 records
# ─────────────────────────────────────────────────────────────────────────────
head("Maintenance Records (target: 50)")

existing_maint = db.query(MaintenanceRecord).count()
skip(f"Already have {existing_maint} record(s) in DB")

MAINT_CATS = list(MaintenanceCategoryEnum)
MAINT_STATS = list(MaintenanceStatusEnum)

to_add = max(0, 50 - existing_maint)
for i in range(to_add):
    veh = random.choice(created_vehicles)
    cat = random.choice(MAINT_CATS)
    st  = random.choice(MAINT_STATS)
    svc_date = rand_date_past(90)
    next_svc  = svc_date + timedelta(days=random.randint(30, 180))

    m = MaintenanceRecord(
        vehicle_id=veh.id,
        category=cat,
        service_date=svc_date,
        next_service_date=next_svc,
        service_cost=round(random.uniform(500.0, 50000.0), 2),
        service_provider=random.choice(PROVIDERS),
        status=st,
        notes=f"Routine {cat.value.lower()} — {random.choice(['all good', 'minor wear noted', 'parts replaced', 'filter cleaned', 'oil changed', 'brake pads replaced'])}",
        created_at=datetime.combine(svc_date, datetime.min.time()).replace(tzinfo=timezone.utc),
    )
    db.add(m)
    db.flush()
    ok(f"Maintenance #{m.id} — {veh.registration_number} | {cat.value} [{st.value}]")

db.commit()
print(f"  Total maintenance records: {db.query(MaintenanceRecord).count()}")


# ─────────────────────────────────────────────────────────────────────────────
# 6. DRIVER ASSIGNMENTS — 50 records
#    Historical assignments — statuses can be COMPLETED / CANCELLED freely
#    Only ACTIVE assignments constrain the driver/vehicle current_status
# ─────────────────────────────────────────────────────────────────────────────
head("Driver Assignments (target: 50)")

existing_asgn = db.query(DriverAssignment).count()
skip(f"Already have {existing_asgn} assignment(s) in DB")

to_add = max(0, 50 - existing_asgn)
# Historical records — use COMPLETED mostly so we don't lock everyone up
ASGN_STATUSES = (
    [AssignmentStatusEnum.COMPLETED] * 6 +
    [AssignmentStatusEnum.CANCELLED] * 2 +
    [AssignmentStatusEnum.ACTIVE]    * 2
)

for i in range(to_add):
    drv = random.choice(created_drivers)
    veh = random.choice(created_vehicles)
    trip = random.choice(created_trips) if random.random() > 0.3 else None
    st   = random.choice(ASGN_STATUSES)
    asgn_date = rand_dt_past(90)

    a = DriverAssignment(
        driver_id=drv.id,
        vehicle_id=veh.id,
        trip_id=trip.id if trip else None,
        assignment_date=asgn_date,
        status=st,
        remarks=random.choice([
            "Long-haul assignment", "City delivery run", "Inter-state freight",
            "Express delivery", "Regular scheduled run", None, None,
            "Priority shipment", "Cold chain logistics", "Night delivery run",
        ]),
    )
    db.add(a)
    db.flush()
    ok(f"Assignment #{a.id} — Driver #{drv.id} + Vehicle #{veh.id} [{st.value}]")

db.commit()

# Set ACTIVE ones: update driver/vehicle status
active_asgns = db.query(DriverAssignment).filter(
    DriverAssignment.status == AssignmentStatusEnum.ACTIVE
).all()
for a in active_asgns:
    drv = db.get(Driver, a.driver_id)
    veh = db.get(Vehicle, a.vehicle_id)
    if drv: drv.status = DriverStatusEnum.ON_DUTY
    if veh: veh.current_status = VehicleStatusEnum.IN_USE

db.commit()
print(f"  Total assignments: {db.query(DriverAssignment).count()}")


# ─────────────────────────────────────────────────────────────────────────────
# 7. DRIVER ATTENDANCE — 50 records
#    Spread across last 30 days, different drivers, no duplicate (driver, date)
# ─────────────────────────────────────────────────────────────────────────────
head("Driver Attendance (target: 50)")

existing_att = db.query(DriverAttendance).count()
skip(f"Already have {existing_att} record(s) in DB")

# Track (driver_id, date) pairs already in DB
used_att_pairs = {
    (r.driver_id, r.date)
    for r in db.query(DriverAttendance).all()
}

ATT_STATUSES = list(AttendanceStatusEnum)
ATT_WEIGHTS  = [AttendanceStatusEnum.PRESENT] * 7 + \
               [AttendanceStatusEnum.ABSENT]  * 2 + \
               [AttendanceStatusEnum.LEAVE]   * 1

to_add = max(0, 50 - existing_att)
attempts = 0
added    = 0

while added < to_add and attempts < 1000:
    attempts += 1
    drv  = random.choice(created_drivers)
    d    = date.today() - timedelta(days=random.randint(0, 59))
    pair = (drv.id, d)
    if pair in used_att_pairs:
        continue
    used_att_pairs.add(pair)

    st = random.choice(ATT_WEIGHTS)
    # Only PRESENT gets check-in/out times
    if st == AttendanceStatusEnum.PRESENT:
        hour_in  = random.randint(7, 10)
        hour_out = hour_in + random.randint(8, 10)
        cin  = datetime.combine(d, datetime.min.time()).replace(
            tzinfo=timezone.utc) + timedelta(hours=hour_in,  minutes=random.randint(0,59))
        cout = datetime.combine(d, datetime.min.time()).replace(
            tzinfo=timezone.utc) + timedelta(hours=hour_out, minutes=random.randint(0,59))
    else:
        cin = cout = None

    rec = DriverAttendance(
        driver_id=drv.id,
        date=d,
        status=st,
        check_in_time=cin,
        check_out_time=cout,
    )
    db.add(rec)
    db.flush()
    added += 1
    ok(f"Attendance #{rec.id} — Driver #{drv.id} | {d} [{st.value}]")

db.commit()
print(f"  Total attendance records: {db.query(DriverAttendance).count()}")


# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
db2 = SessionLocal()
print(f"\n{'=' * 65}")
print(f"  {BOLD}✅  Bulk seed complete!{RESET}")
print(f"{'=' * 65}")
print(f"  Users               : {db2.query(User).count():>5}  (untouched)")
print(f"  Vehicles            : {db2.query(Vehicle).count():>5}")
print(f"  Drivers             : {db2.query(Driver).count():>5}")
print(f"  Shipments           : {db2.query(Shipment).count():>5}")
print(f"  Trips               : {db2.query(Trip).count():>5}")
print(f"  Maintenance Records : {db2.query(MaintenanceRecord).count():>5}")
print(f"  Driver Assignments  : {db2.query(DriverAssignment).count():>5}")
print(f"  Driver Attendance   : {db2.query(DriverAttendance).count():>5}")
print(f"{'=' * 65}\n")
db2.close()
db.close()
sys.exit(0)
