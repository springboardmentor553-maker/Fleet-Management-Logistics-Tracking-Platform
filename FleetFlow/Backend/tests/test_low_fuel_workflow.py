import os
import sys
import logging
from sqlalchemy.orm import Session

# Configure stdout encoding for Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine, Base
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.notification import Notification
from app.tasks.fuel_tasks import run_low_fuel_alerts_check
from app.services.vehicle import update_vehicle
from app.schemas.vehicle import VehicleUpdate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_low_fuel_workflow")

def run_test():
    db: Session = SessionLocal()
    try:
        print("=== STARTING LOW FUEL NOTIFICATION WORKFLOW TEST ===")
        
        # 1. Setup Test Vehicle & Driver
        test_driver_email = "sahil.test@fleetflow.com"
        test_driver_phone = "+919876543210"
        
        driver = db.query(Driver).filter(Driver.email == test_driver_email).first()
        if not driver:
            driver = Driver(
                name="Sahil TestDriver",
                email=test_driver_email,
                phone=test_driver_phone,
                license_number="TEST-LIC-9999",
                is_available=True
            )
            db.add(driver)
            db.commit()
            db.refresh(driver)
            print(f"Created test driver: {driver.name} (ID: {driver.id}, Phone: {driver.phone}, Email: {driver.email})")
        else:
            print(f"Using existing test driver: {driver.name} (ID: {driver.id}, Phone: {driver.phone}, Email: {driver.email})")
            
        vehicle_plate = "TEST-001-FUEL"
        vehicle = db.query(Vehicle).filter(Vehicle.plate_number == vehicle_plate).first()
        if not vehicle:
            vehicle = Vehicle(
                plate_number=vehicle_plate,
                vehicle_type="Truck",
                model="Volvo FH16",
                capacity_kg=20000.0,
                fuel_type="Diesel",
                assigned_driver_id=driver.id,
                fuel_level=100.0
            )
            db.add(vehicle)
            db.commit()
            db.refresh(vehicle)
            print(f"Created test vehicle: {vehicle.plate_number} (ID: {vehicle.id}, Fuel: {vehicle.fuel_level}%)")
        else:
            vehicle.assigned_driver_id = driver.id
            vehicle.fuel_level = 100.0
            db.commit()
            db.refresh(vehicle)
            print(f"Reset test vehicle: {vehicle.plate_number} (ID: {vehicle.id}, Fuel: 100.0%)")

        # Clean up any existing notifications for this test vehicle
        db.query(Notification).filter(
            Notification.reference_type == "vehicle",
            Notification.reference_id == vehicle.id
        ).delete(synchronize_session=False)
        db.commit()

        # -------------------------------------------------------------
        # TEST STEP 1: Update Fuel to 15% -> Low Fuel Alert (Category: fuel_low)
        # -------------------------------------------------------------
        print("\n--- STEP 1: Updating Fuel Level to 15% ---")
        update_vehicle(vehicle.id, VehicleUpdate(fuel_level=15.0), db)
        
        # Check generated notifications
        notifs_15 = db.query(Notification).filter(
            Notification.reference_type == "vehicle",
            Notification.reference_id == vehicle.id,
            Notification.is_read == False
        ).all()
        
        print(f"Notifications found for 15% fuel check: {len(notifs_15)}")
        for n in notifs_15:
            print(f"  [Notif #{n.id}] Category: {n.category} | Title: {n.title} | Priority: {n.priority}")
            print(f"                 Message: {n.message}")

        low_fuel_notif = next((n for n in notifs_15 if n.category == "fuel_low"), None)
        assert low_fuel_notif is not None, "FAILED: Low fuel notification (fuel_low) not created!"
        assert "15.0%" in low_fuel_notif.message, "FAILED: Message does not contain 15.0%!"
        assert driver.name in low_fuel_notif.message, f"FAILED: Assigned driver '{driver.name}' not identified in notification message!"
        assert driver.phone in low_fuel_notif.message, f"FAILED: Driver phone '{driver.phone}' not included in notification!"
        assert driver.email in low_fuel_notif.message, f"FAILED: Driver email '{driver.email}' not included in notification!"
        print("✅ In-app notification created with correct assigned driver, phone, and email!")

        # Check SMS and Email notification logs for driver
        sms_notifs = db.query(Notification).filter(
            Notification.reference_type == "driver",
            Notification.reference_id == driver.id,
            Notification.category == "sms"
        ).order_by(Notification.id.desc()).all()
        
        email_notifs = db.query(Notification).filter(
            Notification.reference_type == "driver",
            Notification.reference_id == driver.id,
            Notification.category == "email"
        ).order_by(Notification.id.desc()).all()
        
        assert len(sms_notifs) > 0, "FAILED: SMS dispatch attempt not recorded!"
        assert len(email_notifs) > 0, "FAILED: Email dispatch attempt not recorded!"
        print(f"✅ SMS dispatch recorded: {sms_notifs[0].title}")
        print(f"✅ Email dispatch recorded: {email_notifs[0].title}")

        # -------------------------------------------------------------
        # TEST STEP 2: Duplicate Prevention on 15% Fuel
        # -------------------------------------------------------------
        print("\n--- STEP 2: Running Low Fuel Check again on 15% (Duplicate Prevention Test) ---")
        run_low_fuel_alerts_check(db)
        notifs_dup = db.query(Notification).filter(
            Notification.reference_type == "vehicle",
            Notification.reference_id == vehicle.id,
            Notification.category == "fuel_low",
            Notification.is_read == False
        ).all()
        assert len(notifs_dup) == 1, f"FAILED: Duplicate alert created! Count: {len(notifs_dup)}"
        print("✅ Duplicate alert prevention verified! Count remained 1.")

        # -------------------------------------------------------------
        # TEST STEP 3: Update Fuel to 8% -> Critical Fuel Alert (Category: fuel_critical)
        # -------------------------------------------------------------
        print("\n--- STEP 3: Updating Fuel Level to 8% ---")
        update_vehicle(vehicle.id, VehicleUpdate(fuel_level=8.0), db)
        
        notifs_8 = db.query(Notification).filter(
            Notification.reference_type == "vehicle",
            Notification.reference_id == vehicle.id,
            Notification.is_read == False
        ).all()
        
        print(f"Unread notifications found for 8% fuel check: {len(notifs_8)}")
        for n in notifs_8:
            print(f"  [Notif #{n.id}] Category: {n.category} | Title: {n.title} | Priority: {n.priority}")
        
        crit_fuel_notif = next((n for n in notifs_8 if n.category == "fuel_critical"), None)
        assert crit_fuel_notif is not None, "FAILED: Critical fuel notification (fuel_critical) not created!"
        assert "8.0%" in crit_fuel_notif.message, "FAILED: Message does not contain 8.0%!"
        print("✅ Critical fuel notification created for 8% fuel level!")

        # Verify old fuel_low alert was resolved/marked read
        old_low_check = db.query(Notification).filter(
            Notification.reference_type == "vehicle",
            Notification.reference_id == vehicle.id,
            Notification.category == "fuel_low",
            Notification.is_read == False
        ).first()
        assert old_low_check is None, "FAILED: Old fuel_low notification was not resolved when upgraded to critical!"
        print("✅ Old fuel_low alert resolved when upgraded to fuel_critical!")

        # -------------------------------------------------------------
        # TEST STEP 4: Refuel Vehicle to 50% -> Auto-resolution of alerts
        # -------------------------------------------------------------
        print("\n--- STEP 4: Refueling Vehicle to 50% ---")
        update_vehicle(vehicle.id, VehicleUpdate(fuel_level=50.0), db)
        
        active_fuel_notifs = db.query(Notification).filter(
            Notification.reference_type == "vehicle",
            Notification.reference_id == vehicle.id,
            Notification.category.in_(["fuel_low", "fuel_critical"]),
            Notification.is_read == False
        ).all()
        assert len(active_fuel_notifs) == 0, f"FAILED: Active fuel alerts remaining after refuel! Count: {len(active_fuel_notifs)}"
        print("✅ All active fuel alerts auto-resolved when vehicle refueled above 30%!")

        print("\n========================================================")
        print("🎉 ALL LOW FUEL NOTIFICATION WORKFLOW TESTS PASSED 100%! 🎉")
        print("========================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_test()
