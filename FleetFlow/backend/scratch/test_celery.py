import sys
from datetime import date, timedelta

from app.database import SessionLocal
from app.models.enums import MaintenanceCategoryEnum, MaintenanceStatusEnum
from app.models.maintenance import MaintenanceRecord
from app.models.vehicle import Vehicle

db = SessionLocal()

# 1. Get a vehicle
v = db.query(Vehicle).first()
if not v:
    print("No vehicle found")
    sys.exit(1)

# 2. Create Scheduled record (should generate alert)
m1 = MaintenanceRecord(
    vehicle_id=v.id,
    category=MaintenanceCategoryEnum.OIL_CHANGE,
    service_date=date.today(),
    next_service_date=date.today() + timedelta(days=2),
    status=MaintenanceStatusEnum.SCHEDULED,
    service_cost=100.0,
    notes="Test scheduled"
)
db.add(m1)

# 3. Create Completed record (should NOT generate alert)
m2 = MaintenanceRecord(
    vehicle_id=v.id,
    category=MaintenanceCategoryEnum.TYRE_REPLACEMENT,
    service_date=date.today(),
    next_service_date=date.today() + timedelta(days=2),
    status=MaintenanceStatusEnum.COMPLETED,
    service_cost=50.0,
    notes="Test completed"
)
db.add(m2)
db.commit()
db.refresh(m1)
db.refresh(m2)

print(f"Created Scheduled Maintenance: {m1.id}")
print(f"Created Completed Maintenance: {m2.id}")

db.close()

from app.tasks.maintenance_tasks import check_maintenance_schedules

print("\n--- Running Celery Task ---")
check_maintenance_schedules()

print("\n--- Checking Alerts ---")
from app.models.maintenance_alert import MaintenanceAlert

db = SessionLocal()

a1 = db.query(MaintenanceAlert).filter(MaintenanceAlert.maintenance_id == m1.id).all()
a2 = db.query(MaintenanceAlert).filter(MaintenanceAlert.maintenance_id == m2.id).all()

print(f"Alerts for Scheduled (Expected 1): {len(a1)}")
print(f"Alerts for Completed (Expected 0): {len(a2)}")

print("\n--- Running Celery Task AGAIN (Testing Duplicates) ---")
check_maintenance_schedules()

a1_dup = db.query(MaintenanceAlert).filter(MaintenanceAlert.maintenance_id == m1.id).all()
print(f"Alerts for Scheduled after 2nd run (Expected 1): {len(a1_dup)}")

