import random
import uuid
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models.driver import Driver
from app.models.driver_assignment import DriverAssignment
from app.models.driver_attendance import DriverAttendance
from app.models.enums import (
    AssignmentStatusEnum,
    AttendanceStatusEnum,
    DriverStatusEnum,
    MaintenanceCategoryEnum,
    MaintenanceStatusEnum,
    RoleEnum,
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
from app.services.security import hash_password

db = SessionLocal()

def log(icon, msg):
    print(f"  {icon}  {msg}")

def main():
    print("\n── Creating Users & Drivers (50) ──────────")
    drivers = []
    # Create 50 drivers
    for i in range(1, 51):
        email = f"driver{i}@fleetflow.in"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                hashed_password=hash_password("password123"),
                role=RoleEnum.DRIVER
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        driver = db.query(Driver).filter(Driver.user_id == user.id).first()
        if not driver:
            driver = Driver(
                user_id=user.id,
                license_details=f"DL-{1000+i}-XYZ",
                status=DriverStatusEnum.AVAILABLE,
            )
            db.add(driver)
            db.commit()
            db.refresh(driver)
        drivers.append(driver)
    log("✅", "50 Drivers ensured.")

    print("\n── Creating Vehicles (50) ──────────")
    vehicles = []
    vehicle_types = ["Truck", "Van", "Lorry", "Trailer"]
    for i in range(1, 51):
        reg = f"KA{i%100:02d}X{1000+i}"
        veh = db.query(Vehicle).filter(Vehicle.registration_number == reg).first()
        if not veh:
            veh = Vehicle(
                registration_number=reg,
                vehicle_type=random.choice(vehicle_types),
                capacity=float(random.randint(1000, 5000)),
                fuel_type="Diesel",
                current_status=VehicleStatusEnum.AVAILABLE
            )
            db.add(veh)
            db.commit()
            db.refresh(veh)
        vehicles.append(veh)
    log("✅", "50 Vehicles ensured.")

    print("\n── Setting 17 Vehicles to Maintenance ──────────")
    for i in range(17):
        veh = vehicles[i]
        veh.current_status = VehicleStatusEnum.MAINTENANCE
        db.add(veh)
        db.commit()
        # Add Maintenance Record
        mr = db.query(MaintenanceRecord).filter(MaintenanceRecord.vehicle_id == veh.id).first()
        if not mr:
            mr = MaintenanceRecord(
                vehicle_id=veh.id,
                category=MaintenanceCategoryEnum.GENERAL_INSPECTION,
                service_date=datetime.now(timezone.utc).date() - timedelta(days=random.randint(1,5)),
                service_cost=float(random.randint(1000, 5000)),
                service_provider="Fleet AutoCare",
                notes="Routine maintenance + fluid change",
                status=MaintenanceStatusEnum.IN_PROGRESS
            )
            db.add(mr)
            db.commit()
    log("✅", "17 Vehicles set to maintenance with records.")

    print("\n── Creating Driver Assignments (50) ──────────")
    # Assign the rest of the drivers to the rest of the vehicles (available ones)
    avail_drivers = drivers[17:]
    avail_vehicles = vehicles[17:]
    
    assignments = []
    for d, v in zip(avail_drivers, avail_vehicles):
        da = db.query(DriverAssignment).filter(
            DriverAssignment.driver_id == d.id,
            DriverAssignment.vehicle_id == v.id,
            DriverAssignment.status == AssignmentStatusEnum.ACTIVE
        ).first()
        if not da:
            da = DriverAssignment(
                driver_id=d.id,
                vehicle_id=v.id,
                assignment_date=datetime.now(timezone.utc).date() - timedelta(days=10),
                status=AssignmentStatusEnum.ACTIVE
            )
            d.status = DriverStatusEnum.ON_DUTY
            db.add(da)
            db.add(d)
            db.commit()
            db.refresh(da)
        assignments.append(da)
    log("✅", "Created driver assignments.")

    print("\n── Creating Shipments, Trips, Fuel, Attendance ──────────")
    for idx, (d, v) in enumerate(zip(avail_drivers, avail_vehicles)):
        # Shipment
        start_dt = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))
        is_delayed = (idx % 5 == 0) # Make some delayed
        status = ShipmentStatusEnum.DELIVERED if idx % 2 == 0 else ShipmentStatusEnum.IN_TRANSIT
        if is_delayed:
            status = ShipmentStatusEnum.DELAYED
            
        eta = start_dt + timedelta(days=2)
        if status == ShipmentStatusEnum.DELAYED:
             eta = start_dt - timedelta(days=1) # Already past ETA

        tracking_number = f"TRK-{uuid.uuid4().hex[:8].upper()}"
        shp = Shipment(
            tracking_number=tracking_number,
            sender_name="Acme Corp",
            receiver_name="Stark Industries",
            pickup_location="Mumbai",
            delivery_location="Delhi",
            status=status,
            weight=float(random.randint(100, 1000)),
            eta=eta,
            driver_id=d.id,
            vehicle_id=v.id
        )
        db.add(shp)
        db.commit()
        db.refresh(shp)

        # Trip
        trip = Trip(
            shipment_id=shp.id,
            driver_id=d.id,
            vehicle_id=v.id,
            scheduled_start_time=start_dt,
            scheduled_end_time=start_dt + timedelta(days=3) if status == ShipmentStatusEnum.DELIVERED else None,
            pickup_location="Mumbai",
            destination="Delhi",
            status=TripStatusEnum.COMPLETED if status == ShipmentStatusEnum.DELIVERED else TripStatusEnum.IN_PROGRESS
        )
        if trip.status == TripStatusEnum.IN_PROGRESS:
             d.status = DriverStatusEnum.ON_DUTY
        db.add(trip)
        db.add(d)
        db.commit()

        # Attendance based on trip start date
        att_date = start_dt.date()
        att = db.query(DriverAttendance).filter(DriverAttendance.driver_id == d.id, DriverAttendance.date == att_date).first()
        if not att:
             att = DriverAttendance(
                 driver_id=d.id,
                 date=att_date,
                 status=AttendanceStatusEnum.PRESENT,
                 check_in_time=start_dt.replace(hour=8, minute=0, second=0, microsecond=0),
                 check_out_time=start_dt.replace(hour=20, minute=0, second=0, microsecond=0) if trip.status == TripStatusEnum.COMPLETED else None
             )
             db.add(att)
             db.commit()

        # Fuel Record
        f_date = start_dt.date() + timedelta(days=1)
        qty = float(random.randint(50, 200))
        fuel = FuelRecord(
             vehicle_id=v.id,
             driver_id=d.id, # Assigned driver!
             fuel_date=f_date,
             fuel_quantity=qty,
             fuel_cost=qty * 95.0, # 95.0 per litre
             odometer_reading=random.randint(10000, 50000),
             fuel_station="Reliance Petrol Pump"
        )
        db.add(fuel)
        db.commit()

    log("✅", "Completed Shipments, Trips, Fuel, and Attendance.")
    print("Seed complete!")

if __name__ == "__main__":
    main()
