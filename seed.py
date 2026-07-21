"""
FleetFlow — Database Seed Script
Populates: users, drivers, vehicles, shipments, trips
Run from repo root with venv active:
    python seed.py
"""

import sys
from datetime import datetime, timedelta

from app.database import SessionLocal
from app.models.enums import (
    RoleEnum,
    ShipmentStatusEnum,
    TripStatusEnum,
    VehicleStatusEnum,
)
from app.models.user import User
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.services.security import hash_password

PASS = "\033[92m✅\033[0m"
SKIP = "\033[93m⏭ \033[0m"
FAIL = "\033[91m❌\033[0m"

db = SessionLocal()

def log(icon, msg):
    print(f"  {icon}  {msg}")


# ─────────────────────────────────────────────────────────────────────────────
# 1. USERS  (3 drivers + 1 fleet manager + 1 admin = 5 minimum per spec)
# ─────────────────────────────────────────────────────────────────────────────
print("\n── Users ───────────────────────────────────────────────────────────────")

users_data = [
    {"email": "admin@fleetflow.in",       "role": RoleEnum.ADMIN,         "name": "Admin"},
    {"email": "manager@fleetflow.in",     "role": RoleEnum.FLEET_MANAGER, "name": "Fleet Manager"},
    {"email": "dispatcher@fleetflow.in",  "role": RoleEnum.DISPATCHER,    "name": "Dispatcher"},
    {"email": "ravi.kumar@fleetflow.in",  "role": RoleEnum.DRIVER,        "name": "Driver Ravi"},
    {"email": "priya.sharma@fleetflow.in","role": RoleEnum.DRIVER,        "name": "Driver Priya"},
    {"email": "arjun.singh@fleetflow.in", "role": RoleEnum.DRIVER,        "name": "Driver Arjun"},
    {"email": "neha.verma@fleetflow.in",  "role": RoleEnum.DRIVER,        "name": "Driver Neha"},
    {"email": "suresh.rao@fleetflow.in",  "role": RoleEnum.DRIVER,        "name": "Driver Suresh"},
]

created_users = []
for u in users_data:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if existing:
        log(SKIP, f"User already exists: {u['email']}")
        created_users.append(existing)
    else:
        user = User(
            email=u["email"],
            hashed_password=hash_password("FleetFlow@123"),
            role=u["role"],
        )
        db.add(user)
        db.flush()
        created_users.append(user)
        log(PASS, f"Created user: {u['email']} [{u['role'].value}]")

db.commit()

# Separate by role for easy reference
admin_user    = next(u for u in created_users if u.role == RoleEnum.ADMIN)
manager_user  = next(u for u in created_users if u.role == RoleEnum.FLEET_MANAGER)
driver_users  = [u for u in created_users if u.role == RoleEnum.DRIVER]


# ─────────────────────────────────────────────────────────────────────────────
# 2. DRIVERS  (one Driver profile per driver-role user)
# ─────────────────────────────────────────────────────────────────────────────
print("\n── Drivers ─────────────────────────────────────────────────────────────")

driver_details = [
    {"license": "MH-DL-2019-00123", "name": "Ravi Kumar"},
    {"license": "DL-DL-2020-04567", "name": "Priya Sharma"},
    {"license": "KA-DL-2018-08901", "name": "Arjun Singh"},
    {"license": "TN-DL-2021-01234", "name": "Neha Verma"},
    {"license": "UP-DL-2017-56789", "name": "Suresh Rao"},
]

created_drivers = []
for du, dd in zip(driver_users, driver_details):
    existing = db.query(Driver).filter(Driver.user_id == du.id).first()
    if existing:
        log(SKIP, f"Driver profile already exists for user_id={du.id}")
        created_drivers.append(existing)
    else:
        driver = Driver(user_id=du.id, license_details=dd["license"])
        db.add(driver)
        db.flush()
        created_drivers.append(driver)
        log(PASS, f"Created driver: {dd['name']} | License: {dd['license']}")

db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# 3. VEHICLES
# ─────────────────────────────────────────────────────────────────────────────
print("\n── Vehicles ────────────────────────────────────────────────────────────")

vehicles_data = [
    {
        "registration_number": "MH-12-AB-1234",
        "vehicle_type": "Truck",
        "capacity": 10.0,
        "fuel_type": "Diesel",
        "current_status": VehicleStatusEnum.IN_USE,
        "driver": created_drivers[0],
    },
    {
        "registration_number": "DL-05-CD-5678",
        "vehicle_type": "Van",
        "capacity": 3.5,
        "fuel_type": "Petrol",
        "current_status": VehicleStatusEnum.AVAILABLE,
        "driver": created_drivers[1],
    },
    {
        "registration_number": "KA-01-EF-9012",
        "vehicle_type": "Mini Truck",
        "capacity": 5.0,
        "fuel_type": "CNG",
        "current_status": VehicleStatusEnum.AVAILABLE,
        "driver": created_drivers[2],
    },
    {
        "registration_number": "TN-09-GH-3456",
        "vehicle_type": "Lorry",
        "capacity": 15.0,
        "fuel_type": "Diesel",
        "current_status": VehicleStatusEnum.MAINTENANCE,
        "driver": created_drivers[3],
    },
    {
        "registration_number": "UP-32-IJ-7890",
        "vehicle_type": "Pickup",
        "capacity": 2.0,
        "fuel_type": "Petrol",
        "current_status": VehicleStatusEnum.IN_USE,
        "driver": created_drivers[4],
    },
    {
        "registration_number": "GJ-18-KL-2345",
        "vehicle_type": "Container Truck",
        "capacity": 20.0,
        "fuel_type": "Diesel",
        "current_status": VehicleStatusEnum.AVAILABLE,
        "driver": None,
    },
]

created_vehicles = []
for v in vehicles_data:
    existing = db.query(Vehicle).filter(
        Vehicle.registration_number == v["registration_number"]
    ).first()
    if existing:
        log(SKIP, f"Vehicle already exists: {v['registration_number']}")
        created_vehicles.append(existing)
    else:
        vehicle = Vehicle(
            registration_number=v["registration_number"],
            vehicle_type=v["vehicle_type"],
            capacity=v["capacity"],
            fuel_type=v["fuel_type"],
            current_status=v["current_status"],
            manager_id=manager_user.id,
            driver_id=v["driver"].id if v["driver"] else None,
        )
        db.add(vehicle)
        db.flush()
        created_vehicles.append(vehicle)
        log(PASS, f"Created vehicle: {v['registration_number']} | {v['vehicle_type']} | {v['current_status'].value}")

db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# 4. SHIPMENTS
# ─────────────────────────────────────────────────────────────────────────────
print("\n── Shipments ───────────────────────────────────────────────────────────")

now = datetime.utcnow()

shipments_data = [
    {
        "tracking_number": "FLT100001",
        "sender_name": "Reliance Industries",
        "receiver_name": "Tata Motors",
        "pickup_location": "Mumbai, Maharashtra",
        "delivery_location": "Pune, Maharashtra",
        "status": ShipmentStatusEnum.DELIVERED,
        "weight": 850.0,
        "created_at": now - timedelta(days=5),
        "eta": now - timedelta(days=3),
        "driver": created_drivers[0],
        "vehicle": created_vehicles[0],
    },
    {
        "tracking_number": "FLT100002",
        "sender_name": "Amazon India",
        "receiver_name": "FlipKart Warehouse",
        "pickup_location": "Delhi, NCR",
        "delivery_location": "Gurgaon, Haryana",
        "status": ShipmentStatusEnum.IN_TRANSIT,
        "weight": 320.5,
        "created_at": now - timedelta(days=2),
        "eta": now + timedelta(hours=6),
        "driver": created_drivers[1],
        "vehicle": created_vehicles[1],
    },
    {
        "tracking_number": "FLT100003",
        "sender_name": "Infosys Ltd",
        "receiver_name": "Wipro Technologies",
        "pickup_location": "Bengaluru, Karnataka",
        "delivery_location": "Chennai, Tamil Nadu",
        "status": ShipmentStatusEnum.ASSIGNED,
        "weight": 120.0,
        "created_at": now - timedelta(days=1),
        "eta": now + timedelta(days=1),
        "driver": created_drivers[2],
        "vehicle": created_vehicles[2],
    },
    {
        "tracking_number": "FLT100004",
        "sender_name": "HDFC Bank",
        "receiver_name": "SBI Corporate Office",
        "pickup_location": "Chennai, Tamil Nadu",
        "delivery_location": "Hyderabad, Telangana",
        "status": ShipmentStatusEnum.DELAYED,
        "weight": 55.0,
        "created_at": now - timedelta(days=3),
        "eta": now - timedelta(hours=4),
        "driver": created_drivers[3],
        "vehicle": created_vehicles[3],
    },
    {
        "tracking_number": "FLT100005",
        "sender_name": "Hindustan Unilever",
        "receiver_name": "ITC Limited",
        "pickup_location": "Lucknow, Uttar Pradesh",
        "delivery_location": "Kanpur, Uttar Pradesh",
        "status": ShipmentStatusEnum.CREATED,
        "weight": 430.0,
        "created_at": now,
        "eta": now + timedelta(days=2),
        "driver": None,
        "vehicle": None,
    },
    {
        "tracking_number": "FLT100006",
        "sender_name": "Marico India",
        "receiver_name": "Dabur India",
        "pickup_location": "Ahmedabad, Gujarat",
        "delivery_location": "Surat, Gujarat",
        "status": ShipmentStatusEnum.OUT_FOR_DELIVERY,
        "weight": 275.0,
        "created_at": now - timedelta(days=1),
        "eta": now + timedelta(hours=3),
        "driver": created_drivers[4],
        "vehicle": created_vehicles[4],
    },
    {
        "tracking_number": "FLT100007",
        "sender_name": "Zomato Logistics",
        "receiver_name": "Swiggy Warehouse",
        "pickup_location": "Hyderabad, Telangana",
        "delivery_location": "Vijayawada, Andhra Pradesh",
        "status": ShipmentStatusEnum.PICKED_UP,
        "weight": 190.0,
        "created_at": now - timedelta(hours=8),
        "eta": now + timedelta(hours=10),
        "driver": created_drivers[0],
        "vehicle": created_vehicles[5],
    },
]

created_shipments = []
for s in shipments_data:
    existing = db.query(Shipment).filter(
        Shipment.tracking_number == s["tracking_number"]
    ).first()
    if existing:
        log(SKIP, f"Shipment already exists: {s['tracking_number']}")
        created_shipments.append(existing)
    else:
        shipment = Shipment(
            tracking_number=s["tracking_number"],
            sender_name=s["sender_name"],
            receiver_name=s["receiver_name"],
            pickup_location=s["pickup_location"],
            delivery_location=s["delivery_location"],
            status=s["status"],
            weight=s["weight"],
            created_at=s["created_at"],
            eta=s["eta"],
            driver_id=s["driver"].id if s["driver"] else None,
            vehicle_id=s["vehicle"].id if s["vehicle"] else None,
        )
        db.add(shipment)
        db.flush()
        created_shipments.append(shipment)
        log(PASS, f"Created shipment: {s['tracking_number']} | {s['sender_name']} → {s['receiver_name']} [{s['status'].value}]")

db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# 5. TRIPS
# ─────────────────────────────────────────────────────────────────────────────
print("\n── Trips ───────────────────────────────────────────────────────────────")

trips_data = [
    {
        "shipment": created_shipments[0],  # FLT100001 - DELIVERED
        "driver": created_drivers[0],
        "vehicle": created_vehicles[0],
        "pickup_location": "Mumbai, Maharashtra",
        "destination": "Pune, Maharashtra",
        "pickup_lat": 19.0760,  "pickup_lng": 72.8777,
        "destination_lat": 18.5204, "destination_lng": 73.8567,
        "scheduled_start": now - timedelta(days=5),
        "scheduled_end": now - timedelta(days=3),
        "status": TripStatusEnum.COMPLETED,
    },
    {
        "shipment": created_shipments[1],  # FLT100002 - IN_TRANSIT
        "driver": created_drivers[1],
        "vehicle": created_vehicles[1],
        "pickup_location": "Delhi, NCR",
        "destination": "Gurgaon, Haryana",
        "pickup_lat": 28.7041,  "pickup_lng": 77.1025,
        "destination_lat": 28.4595, "destination_lng": 77.0266,
        "scheduled_start": now - timedelta(days=2),
        "scheduled_end": now + timedelta(hours=6),
        "status": TripStatusEnum.IN_PROGRESS,
    },
    {
        "shipment": created_shipments[2],  # FLT100003 - ASSIGNED
        "driver": created_drivers[2],
        "vehicle": created_vehicles[2],
        "pickup_location": "Bengaluru, Karnataka",
        "destination": "Chennai, Tamil Nadu",
        "pickup_lat": 12.9716,  "pickup_lng": 77.5946,
        "destination_lat": 13.0827, "destination_lng": 80.2707,
        "scheduled_start": now + timedelta(hours=4),
        "scheduled_end": now + timedelta(days=1),
        "status": TripStatusEnum.SCHEDULED,
    },
    {
        "shipment": created_shipments[3],  # FLT100004 - DELAYED
        "driver": created_drivers[3],
        "vehicle": created_vehicles[3],
        "pickup_location": "Chennai, Tamil Nadu",
        "destination": "Hyderabad, Telangana",
        "pickup_lat": 13.0827,  "pickup_lng": 80.2707,
        "destination_lat": 17.3850, "destination_lng": 78.4867,
        "scheduled_start": now - timedelta(days=3),
        "scheduled_end": now - timedelta(hours=4),
        "status": TripStatusEnum.IN_PROGRESS,
    },
    {
        "shipment": created_shipments[5],  # FLT100006 - OUT_FOR_DELIVERY
        "driver": created_drivers[4],
        "vehicle": created_vehicles[4],
        "pickup_location": "Ahmedabad, Gujarat",
        "destination": "Surat, Gujarat",
        "pickup_lat": 23.0225,  "pickup_lng": 72.5714,
        "destination_lat": 21.1702, "destination_lng": 72.8311,
        "scheduled_start": now - timedelta(days=1),
        "scheduled_end": now + timedelta(hours=3),
        "status": TripStatusEnum.IN_PROGRESS,
    },
    {
        "shipment": created_shipments[6],  # FLT100007 - PICKED_UP
        "driver": created_drivers[0],
        "vehicle": created_vehicles[5],
        "pickup_location": "Hyderabad, Telangana",
        "destination": "Vijayawada, Andhra Pradesh",
        "pickup_lat": 17.3850,  "pickup_lng": 78.4867,
        "destination_lat": 16.5062, "destination_lng": 80.6480,
        "scheduled_start": now - timedelta(hours=8),
        "scheduled_end": now + timedelta(hours=10),
        "status": TripStatusEnum.IN_PROGRESS,
    },
]

for t in trips_data:
    # A shipment can have at most one trip (UNIQUE constraint)
    existing = db.query(Trip).filter(
        Trip.shipment_id == t["shipment"].id
    ).first()
    if existing:
        log(SKIP, f"Trip already exists for shipment {t['shipment'].tracking_number}")
    else:
        trip = Trip(
            shipment_id=t["shipment"].id,
            driver_id=t["driver"].id,
            vehicle_id=t["vehicle"].id,
            pickup_location=t["pickup_location"],
            destination=t["destination"],
            pickup_lat=t["pickup_lat"],
            pickup_lng=t["pickup_lng"],
            destination_lat=t["destination_lat"],
            destination_lng=t["destination_lng"],
            scheduled_start_time=t["scheduled_start"],
            scheduled_end_time=t["scheduled_end"],
            status=t["status"],
            created_at=now,
        )
        db.add(trip)
        db.flush()
        log(PASS, f"Created trip: {t['pickup_location']} → {t['destination']} [{t['status'].value}]")

db.commit()
db.close()


# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 65)
print("  ✅  Seed complete! Counts in database:")
print("=" * 65)

db2 = SessionLocal()
print(f"  Users     : {db2.query(User).count()}")
print(f"  Drivers   : {db2.query(Driver).count()}")
print(f"  Vehicles  : {db2.query(Vehicle).count()}")
print(f"  Shipments : {db2.query(Shipment).count()}")
print(f"  Trips     : {db2.query(Trip).count()}")
print("=" * 65 + "\n")
db2.close()
sys.exit(0)
