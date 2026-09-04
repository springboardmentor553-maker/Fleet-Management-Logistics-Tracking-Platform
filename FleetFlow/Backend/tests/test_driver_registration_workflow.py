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
from app.models.user import User
from app.models.driver import Driver
from app.schemas.user import UserRegister
from app.services.auth import register_user
from app.services.driver import get_all_drivers

logging.basicConfig(level=logging.INFO)

def run_test():
    db: Session = SessionLocal()
    try:
        print("=== STARTING DRIVER REGISTRATION WORKFLOW TEST ===")

        # -------------------------------------------------------------
        # STEP 1: Register User with role == "driver"
        # -------------------------------------------------------------
        driver_email = "testdriver.reg@example.com"
        
        # Clean up previous test run if exists
        existing_u = db.query(User).filter(User.email == driver_email).first()
        if existing_u:
            db.delete(existing_u)
        existing_d = db.query(Driver).filter(Driver.email == driver_email).first()
        if existing_d:
            db.delete(existing_d)
        db.commit()

        reg_data = UserRegister(
            name="Test Driver Reg",
            email=driver_email,
            password="password123",
            role="driver"
        )
        
        user_res = register_user(reg_data, db)
        print(f"Created User: ID {user_res.id}, Name: '{user_res.name}', Role: '{user_res.role}'")

        # -------------------------------------------------------------
        # STEP 2: Verify user appears in users table
        # -------------------------------------------------------------
        u_record = db.query(User).filter(User.email == driver_email).first()
        assert u_record is not None, "FAILED: User not found in users table!"
        assert u_record.role == "driver", f"FAILED: Incorrect role '{u_record.role}'!"
        print("✅ Step 2 Verified: User created in users table with role 'driver'")

        # -------------------------------------------------------------
        # STEP 3: Verify corresponding driver record created in drivers table
        # -------------------------------------------------------------
        d_record = db.query(Driver).filter(Driver.email == driver_email).first()
        assert d_record is not None, "FAILED: Driver record NOT created in drivers table!"
        assert d_record.name == "Test Driver Reg", f"FAILED: Driver name mismatch '{d_record.name}'!"
        assert d_record.phone is not None and len(d_record.phone) > 0, "FAILED: Driver phone missing!"
        assert d_record.license_number is not None and len(d_record.license_number) > 0, "FAILED: Driver license_number missing!"
        print(f"✅ Step 3 Verified: Driver created in drivers table (ID: {d_record.id}, Phone: {d_record.phone}, License: {d_record.license_number})")

        # -------------------------------------------------------------
        # STEP 4: Call get_all_drivers() and verify driver appears
        # -------------------------------------------------------------
        all_drivers = get_all_drivers(db)
        found_in_list = any(d.email == driver_email for d in all_drivers)
        assert found_in_list, "FAILED: Registered driver not returned in get_all_drivers() list!"
        print(f"✅ Step 4 Verified: get_all_drivers() returned new driver (Total drivers in list: {len(all_drivers)})")

        # -------------------------------------------------------------
        # STEP 5: Register Non-Driver User (role == "fleet_manager")
        # -------------------------------------------------------------
        manager_email = "manager.test@example.com"
        existing_mgr = db.query(User).filter(User.email == manager_email).first()
        if existing_mgr:
            db.delete(existing_mgr)
            db.commit()

        mgr_reg = UserRegister(
            name="Test Fleet Manager",
            email=manager_email,
            password="password123",
            role="fleet_manager"
        )
        mgr_user = register_user(mgr_reg, db)
        mgr_driver = db.query(Driver).filter(Driver.email == manager_email).first()
        assert mgr_user is not None, "FAILED: Manager user not created!"
        assert mgr_driver is None, "FAILED: Driver record should NOT be created for non-driver role!"
        print("✅ Step 5 Verified: Non-driver user created in users table only, NOT drivers table")

        # -------------------------------------------------------------
        # STEP 6: Verify existing drivers (Sahil, Rahul, Balaji) remain intact
        # -------------------------------------------------------------
        driver_names = [d.name for d in get_all_drivers(db)]
        print(f"Current Drivers List: {driver_names}")
        for core_name in ["Sahil", "Rahul", "Balaji"]:
            assert any(core_name in name for name in driver_names), f"FAILED: Core driver '{core_name}' missing!"
        print("✅ Step 6 Verified: Pre-existing drivers remain 100% intact")

        print("\n========================================================")
        print("🎉 ALL DRIVER REGISTRATION WORKFLOW TESTS PASSED 100%! 🎉")
        print("========================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_test()
