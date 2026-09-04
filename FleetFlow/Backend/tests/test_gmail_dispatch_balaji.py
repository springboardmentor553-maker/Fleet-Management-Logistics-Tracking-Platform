import os
import sys
import logging
from sqlalchemy.orm import Session

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.notification import Notification
from app.services.vehicle import update_vehicle
from app.schemas.vehicle import VehicleUpdate

logging.basicConfig(level=logging.INFO)

def run_balaji_test():
    db: Session = SessionLocal()
    try:
        print("=== TESTING CRITICAL FUEL ALERT FOR BALAJI (patilbalaji1705@gmail.com) ===")
        
        # 1. Setup Driver Balaji
        balaji_email = "patilbalaji1705@gmail.com"
        driver = db.query(Driver).filter(Driver.email == balaji_email).first()
        if not driver:
            driver = Driver(
                name="Balaji",
                email=balaji_email,
                phone="7899634810",
                license_number="KA-1023456723",
                is_available=True
            )
            db.add(driver)
            db.commit()
            db.refresh(driver)
            print(f"Created driver Balaji: ID {driver.id}, Email: {driver.email}")
        else:
            print(f"Using existing driver Balaji: ID {driver.id}, Email: {driver.email}")

        # 2. Setup Vehicle Test-003
        plate = "Test-003"
        vehicle = db.query(Vehicle).filter(Vehicle.plate_number == plate).first()
        if not vehicle:
            vehicle = Vehicle(
                plate_number=plate,
                vehicle_type="Truck",
                model="Tata",
                capacity_kg=5000.0,
                fuel_type="Diesel",
                assigned_driver_id=driver.id,
                fuel_level=100.0
            )
            db.add(vehicle)
            db.commit()
            db.refresh(vehicle)
            print(f"Created vehicle {vehicle.plate_number}: ID {vehicle.id}")
        else:
            vehicle.assigned_driver_id = driver.id
            vehicle.fuel_level = 100.0
            db.commit()
            db.refresh(vehicle)
            print(f"Updated vehicle {vehicle.plate_number}: assigned to Balaji (ID {driver.id})")

        # Clear existing unread fuel notifications for Test-003
        db.query(Notification).filter(
            Notification.reference_type == "vehicle",
            Notification.reference_id == vehicle.id
        ).delete(synchronize_session=False)
        db.commit()

        # 3. Trigger Critical Fuel Alert (8%)
        print("\n--- Triggering Critical Fuel (8%) for Test-003 ---")
        update_vehicle(vehicle.id, VehicleUpdate(fuel_level=8.0), db)

        # 4. Check generated email notification
        email_notif = db.query(Notification).filter(
            Notification.category == "email",
            Notification.reference_id == driver.id
        ).order_by(Notification.id.desc()).first()

        assert email_notif is not None, "FAILED: Email notification record not found!"
        print(f"\nCreated Notification Title: {email_notif.title}")
        print(f"Notification Message: {email_notif.message}")

        assert "(SENT)" in email_notif.title or "Sent" in email_notif.title, f"FAILED: Title does not show SENT! Got: {email_notif.title}"
        print(f"\n✅ LIVE GMAIL DISPATCH SUCCESSFUL TO {balaji_email}!")

    finally:
        db.close()

if __name__ == "__main__":
    run_balaji_test()
