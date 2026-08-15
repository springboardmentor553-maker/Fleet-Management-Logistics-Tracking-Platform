import sys
import os
from datetime import datetime, timedelta

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.driver import Driver, DriverStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.shipment import Shipment, ShipmentStatus
from app.utils.auth import get_password_hash

def seed_database():
    db = SessionLocal()
    try:
        print("Checking existing database users...")
        user_count = db.query(User).count()
        if user_count > 0:
            print(f"Database already has {user_count} users. Seeding skipped.")
            return

        print("Seeding database with test data...")

        # 1. Create Users
        admin_pass = get_password_hash("admin123")
        manager_pass = get_password_hash("manager123")
        dispatcher_pass = get_password_hash("dispatcher123")
        driver_pass = get_password_hash("driver123")

        admin_user = User(
            email="admin@fleetflow.com",
            hashed_password=admin_pass,
            full_name="Alex Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        manager_user = User(
            email="manager@fleetflow.com",
            hashed_password=manager_pass,
            full_name="Maggie Manager",
            role=UserRole.MANAGER,
            is_active=True
        )
        dispatcher_user = User(
            email="dispatcher@fleetflow.com",
            hashed_password=dispatcher_pass,
            full_name="Danny Dispatcher",
            role=UserRole.DISPATCHER,
            is_active=True
        )
        driver_user = User(
            email="driver@fleetflow.com",
            hashed_password=driver_pass,
            full_name="Dave Driver",
            role=UserRole.DRIVER,
            is_active=True
        )

        db.add_all([admin_user, manager_user, dispatcher_user, driver_user])
        db.flush()  # To populate IDs

        print(f"Created users:\n - Admin: {admin_user.email}\n - Manager: {manager_user.email}\n - Dispatcher: {dispatcher_user.email}\n - Driver: {driver_user.email}")

        # 2. Create Driver details
        driver_details = Driver(
            user_id=driver_user.id,
            license_number="DL-123456789",
            phone_number="+1 (555) 123-4567",
            status=DriverStatus.AVAILABLE
        )
        db.add(driver_details)
        db.flush()

        print(f"Created driver profile linked to user: license={driver_details.license_number}")

        # 3. Create Vehicles
        v1 = Vehicle(
            make="Freightliner",
            model="Cascadia",
            year=2022,
            license_plate="FL-9876",
            vin="VIN12345678901234",
            status=VehicleStatus.ACTIVE,
            capacity_weight=15000.0,
            capacity_volume=80.0
        )
        v2 = Vehicle(
            make="Volvo",
            model="VNL 860",
            year=2023,
            license_plate="VL-5432",
            vin="VIN23456789012345",
            status=VehicleStatus.ACTIVE,
            capacity_weight=18000.0,
            capacity_volume=90.0
        )
        v3 = Vehicle(
            make="Peterbilt",
            model="579",
            year=2021,
            license_plate="PB-1111",
            vin="VIN34567890123456",
            status=VehicleStatus.MAINTENANCE,
            capacity_weight=16000.0,
            capacity_volume=85.0
        )
        db.add_all([v1, v2, v3])
        db.flush()

        print("Created fleet vehicles: Freightliner Cascadia, Volvo VNL 860, Peterbilt 579.")

        # 4. Create Shipments
        s1 = Shipment(
            tracking_number="FLT100001",
            sender_name="Acme Corp",
            receiver_name="Bob Logistics",
            pickup_location="New York, NY",
            delivery_location="Boston, MA",
            current_status=ShipmentStatus.ASSIGNED,
            assigned_driver_id=driver_details.id,
            assigned_vehicle_id=v1.id,
            weight=4500.0
        )
        s2 = Shipment(
            tracking_number="FLT100002",
            sender_name="Global Traders",
            receiver_name="Charlie Retail",
            pickup_location="Chicago, IL",
            delivery_location="Detroit, MI",
            current_status=ShipmentStatus.CREATED,
            assigned_driver_id=None,
            assigned_vehicle_id=None,
            weight=8200.0
        )
        s3 = Shipment(
            tracking_number="FLT100003",
            sender_name="Supermart Inc",
            receiver_name="Dave Dist",
            pickup_location="Los Angeles, CA",
            delivery_location="San Francisco, CA",
            current_status=ShipmentStatus.DELIVERED,
            assigned_driver_id=driver_details.id,
            assigned_vehicle_id=v2.id,
            weight=6000.0
        )
        s4 = Shipment(
            tracking_number="FLT100004",
            sender_name="Prime Supply",
            receiver_name="Eve Freight",
            pickup_location="Houston, TX",
            delivery_location="Dallas, TX",
            current_status=ShipmentStatus.IN_TRANSIT,
            assigned_driver_id=driver_details.id,
            assigned_vehicle_id=v1.id,
            weight=3100.0
        )
        db.add_all([s1, s2, s3, s4])
        
        # Mark driver status as busy/on_trip since they are in transit
        driver_details.status = DriverStatus.ON_TRIP

        db.commit()
        print("Successfully seeded all test data in database!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
