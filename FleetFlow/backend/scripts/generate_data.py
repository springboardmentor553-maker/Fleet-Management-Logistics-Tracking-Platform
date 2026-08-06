import os
import sys
import random
from datetime import date, datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.database import engine
from app.models.core import Vehicle, Driver
from app.models.driver_assignment import DriverAssignment
from app.models.fuel_record import FuelRecord
from app.models.enums import AssignmentStatusEnum

def generate_data():
    with Session(engine) as db:
        vehicles = db.query(Vehicle).all()
        drivers = db.query(Driver).all()
        
        if not vehicles or not drivers:
            print("No vehicles or drivers found.")
            return
            
        print(f"Found {len(vehicles)} vehicles and {len(drivers)} drivers.")
        
        # Create 50 assignments
        assignments_added = 0
        for i in range(50):
            vehicle = random.choice(vehicles)
            driver = random.choice(drivers)
            
            # Check if this combination already has an active assignment
            existing = db.query(DriverAssignment).filter_by(
                vehicle_id=vehicle.id,
                driver_id=driver.id,
                status=AssignmentStatusEnum.ACTIVE
            ).first()
            
            if not existing:
                start_date = datetime.utcnow() - timedelta(days=random.randint(1, 30))
                assignment = DriverAssignment(
                    driver_id=driver.id,
                    vehicle_id=vehicle.id,
                    assignment_date=start_date,
                    status=AssignmentStatusEnum.ACTIVE
                )
                db.add(assignment)
                assignments_added += 1
                
        # Create 50 fuel records
        fuel_added = 0
        stations = ["Shell", "IndianOil", "Bharat Petroleum", "Hindustan Petroleum", "Reliance"]
        
        # Hardcoded fuel cost as per user request (95 per liter)
        FUEL_COST_PER_LITER = 95.0
        
        for i in range(50):
            vehicle = random.choice(vehicles)
            # Find active assignment for this vehicle to get driver
            assignment = db.query(DriverAssignment).filter_by(
                vehicle_id=vehicle.id,
                status=AssignmentStatusEnum.ACTIVE
            ).first()
            
            driver_id = assignment.driver_id if assignment else None
            
            fuel_qty = random.uniform(20.0, 100.0)
            fuel_date = date.today() - timedelta(days=random.randint(1, 30))
            
            fuel = FuelRecord(
                vehicle_id=vehicle.id,
                driver_id=driver_id,
                fuel_quantity=round(fuel_qty, 2),
                fuel_cost=round(fuel_qty * FUEL_COST_PER_LITER, 2),
                odometer_reading=random.uniform(5000, 50000),
                fuel_date=fuel_date,
                fuel_station=random.choice(stations),
                remarks=f"Regular refueling"
            )
            db.add(fuel)
            fuel_added += 1
            
        db.commit()
        print(f"Added {assignments_added} assignments and {fuel_added} fuel records.")

if __name__ == "__main__":
    generate_data()
