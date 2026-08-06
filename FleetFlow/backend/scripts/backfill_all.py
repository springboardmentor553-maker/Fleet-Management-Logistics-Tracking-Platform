import os
import random
import sys
from datetime import datetime, timedelta, timezone

# Setup Django/FastAPI equivalent environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
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
    VehicleStatusEnum,
)
from app.models.fuel_record import FuelRecord
from app.models.maintenance import MaintenanceRecord
from app.models.trip import Trip
from app.models.vehicle import Vehicle


def run():
    db = SessionLocal()
    try:
        vehicles = db.query(Vehicle).all()
        drivers = db.query(Driver).all()
        
        if not vehicles or not drivers:
            print("No vehicles or drivers found.")
            return
            
        print(f"Found {len(vehicles)} vehicles and {len(drivers)} drivers.")

        # 1. Driver Assignments (need 50)
        assignments_count = db.query(DriverAssignment).count()
        needed_assignments = max(0, 50 - assignments_count)
        for _ in range(needed_assignments):
            v = random.choice(vehicles)
            d = random.choice(drivers)
            a = DriverAssignment(
                driver_id=d.id,
                vehicle_id=v.id,
                start_date=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)),
                status=AssignmentStatusEnum.ACTIVE,
                notes="Backfilled assignment"
            )
            db.add(a)
        
        # Make sure at least some drivers are ON_DUTY
        for d in drivers:
            d.status = DriverStatusEnum.ON_DUTY
            
        # 2. Fuel Logs (need 50)
        fuel_count = db.query(FuelRecord).count()
        needed_fuel = max(0, 50 - fuel_count)
        for _ in range(needed_fuel):
            v = random.choice(vehicles)
            d = random.choice(drivers)
            f = FuelRecord(
                vehicle_id=v.id,
                driver_id=d.id,
                fuel_quantity=random.uniform(20.0, 100.0),
                fuel_cost=0.0, # We'll set this below based on 95.0
                odometer_reading=random.randint(5000, 50000),
                fuel_date=datetime.now(timezone.utc).date() - timedelta(days=random.randint(1, 10)),
                fuel_station="Backfilled Location",
                remarks="Backfilled fuel record"
            )
            f.fuel_cost = f.fuel_quantity * 95.0
            db.add(f)

        # Ensure all existing fuel records have correct cost (95 per litre)
        existing_fuels = db.query(FuelRecord).all()
        for ef in existing_fuels:
            ef.fuel_cost = float(ef.fuel_quantity) * 95.0
            if ef.driver_id is None:
                ef.driver_id = random.choice(drivers).id
                
        # 3. Maintenance Records for MAINTENANCE vehicles
        m_vehicles = db.query(Vehicle).filter(Vehicle.current_status == VehicleStatusEnum.MAINTENANCE).all()
        print(f"Found {len(m_vehicles)} vehicles in MAINTENANCE status")
        for mv in m_vehicles:
            mr_count = db.query(MaintenanceRecord).filter(MaintenanceRecord.vehicle_id == mv.id).count()
            if mr_count == 0:
                mr = MaintenanceRecord(
                    vehicle_id=mv.id,
                    category=MaintenanceCategoryEnum.REPAIR,
                    service_date=(datetime.now(timezone.utc) - timedelta(days=1)).date(),
                    notes="Backfilled maintenance record",
                    service_cost=random.uniform(100, 1000),
                    status=MaintenanceStatusEnum.IN_PROGRESS,
                    next_service_date=(datetime.now(timezone.utc) + timedelta(days=30)).date()
                )
                db.add(mr)

        # 4. Driver Attendance based on trips
        trips = db.query(Trip).all()
        for t in trips:
            if not t.driver_id:
                continue
            
            # Use naive date for tracking since Trip uses naive
            trip_date = t.scheduled_start_time.date() if t.scheduled_start_time else datetime.utcnow().date()
            
            existing_att = db.query(DriverAttendance).filter(
                DriverAttendance.driver_id == t.driver_id,
                DriverAttendance.date == trip_date
            ).first()
            
            if not existing_att:
                att = DriverAttendance(
                    driver_id=t.driver_id,
                    date=trip_date,
                    status=AttendanceStatusEnum.PRESENT,
                    check_in=t.scheduled_start_time,
                    check_out=t.scheduled_end_time,
                    notes=f"Auto-generated from Trip {t.id}"
                )
                db.add(att)

        db.commit()
        print("Backfill complete.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run()
