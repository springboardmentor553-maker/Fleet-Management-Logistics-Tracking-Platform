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
from app.models.shipment import Shipment
from app.models.notification import Notification
from app.schemas.shipment import ShipmentCreate, ShipmentAssign
from app.services.shipment import create_shipment
from app.routers.dispatcher import assign_shipment
from app.models.user import User

logging.basicConfig(level=logging.INFO)

def run_test():
    db: Session = SessionLocal()
    try:
        print("=== TESTING DISPATCHER ASSIGNMENT & NOTIFICATION FOR DATTATRI ===")

        # 1. Driver Dattatri
        driver = db.query(Driver).filter(Driver.email == "24mca010@caias.in").first()
        if not driver:
            driver = Driver(
                name="Dattatri",
                email="24mca010@caias.in",
                phone="+919876543210",
                license_number="DL-DATTATRI-99",
                is_available=True
            )
            db.add(driver)
            db.commit()
            db.refresh(driver)
        print(f"Driver: {driver.name} ({driver.email})")

        # 2. Vehicle
        vehicle = db.query(Vehicle).first()
        if not vehicle:
            vehicle = Vehicle(
                plate_number="KA-01-TEST",
                vehicle_type="Truck",
                model="Tata Ace",
                capacity_kg=2000.0,
                fuel_type="Diesel",
                fuel_level=100.0,
                current_status="available"
            )
            db.add(vehicle)
            db.commit()
            db.refresh(vehicle)
        print(f"Vehicle: {vehicle.plate_number}")

        # 3. Create Shipment
        shipment_data = ShipmentCreate(
            origin="Bangalore",
            destination="Mysore",
            weight_kg=500.0,
            description="Electronic Goods"
        )
        shipment = create_shipment(shipment_data, db)
        print(f"Created Shipment #{shipment.id}: {shipment.origin} -> {shipment.destination}")

        # 4. Dummy user
        admin_user = db.query(User).first()

        # 5. Assign Shipment & Vehicle to Driver via Dispatcher
        assign_payload = ShipmentAssign(
            shipment_id=shipment.id,
            driver_id=driver.id,
            vehicle_id=vehicle.id
        )
        assign_shipment(shipment.id, assign_payload, db=db, _=admin_user)

        # 6. Verify Notifications Created
        notifs = db.query(Notification).filter(
            Notification.reference_type == "driver",
            Notification.reference_id == driver.id
        ).order_by(Notification.id.desc()).all()

        print(f"\nNotifications found for Driver #{driver.id}: {len(notifs)}")
        for n in notifs:
            print(f"  [#{n.id}] Category: {n.category} | Title: {n.title}")

        assign_notif = next((n for n in notifs if n.category == "driver_assignment"), None)
        email_notif = next((n for n in notifs if n.category == "email"), None)

        assert assign_notif is not None, "FAILED: Driver assignment notification not created!"
        assert email_notif is not None, "FAILED: Email notification not created!"

        print("\n✅ Driver Assignment In-App Notification created successfully!")
        print(f"✅ Driver Email Notification: {email_notif.title}")
        print("\n========================================================")
        print("🎉 DISPATCHER DRIVER ASSIGNMENT TEST PASSED 100%! 🎉")
        print("========================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_test()
