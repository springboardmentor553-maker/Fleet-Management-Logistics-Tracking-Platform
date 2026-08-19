from app.database import engine
from sqlalchemy import inspect

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.shipment import Shipment
from app.models.maintenance import MaintenanceRecord
from app.models.fuel import FuelLog
from app.models.driver_assignment import DriverAssignment
from app.models.driver_attendance import DriverAttendance
from app.models.maintenance_alert import MaintenanceAlert
from app.models.audit_log import AuditLog
from app.models.route import Route
from app.models.notification import Notification
from app.models.trip import Trip


inspector = inspect(engine)

models = [
    User,
    Vehicle,
    Driver,
    Shipment,
    MaintenanceRecord,
    FuelLog,
    DriverAssignment,
    DriverAttendance,
    MaintenanceAlert,
    AuditLog,
    Route,
    Notification,
    Trip,
]

database_tables = set(inspector.get_table_names())

print("=" * 80)
print("FLEETFLOW DATABASE / MODEL AUDIT")
print("=" * 80)

for model in models:

    table_name = model.__tablename__

    print()
    print("-" * 80)
    print(f"MODEL : {model.__name__}")
    print(f"TABLE : {table_name}")
    print("-" * 80)

    # --------------------------------------------------
    # Check table existence
    # --------------------------------------------------

    if table_name not in database_tables:
        print("❌ TABLE DOES NOT EXIST IN DATABASE")
        continue

    # --------------------------------------------------
    # Database columns
    # --------------------------------------------------

    db_columns = {
        column["name"]
        for column in inspector.get_columns(table_name)
    }

    # --------------------------------------------------
    # Model columns
    # --------------------------------------------------

    model_columns = {
        column.name
        for column in model.__table__.columns
    }

    # --------------------------------------------------
    # Compare
    # --------------------------------------------------

    missing = model_columns - db_columns
    extra = db_columns - model_columns

    print("Database columns:")
    print(" ", sorted(db_columns))

    print()
    print("Model columns:")
    print(" ", sorted(model_columns))

    print()

    if missing:
        print("❌ MODEL COLUMNS MISSING FROM DATABASE:")
        for column in sorted(missing):
            print("   -", column)
    else:
        print("✅ All model columns exist in database")

    print()

    if extra:
        print("ℹ️ EXTRA DATABASE COLUMNS:")
        for column in sorted(extra):
            print("   -", column)
    else:
        print("No extra database columns")


print()
print("=" * 80)
print("AUDIT COMPLETE")
print("=" * 80)