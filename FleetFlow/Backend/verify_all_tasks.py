"""
verify_all_tasks.py
───────────────────
Standalone verification script to test:
- Task 1: MaintenanceAlert model
- Task 2: MaintenanceAlert APIs (Create, Get, Update, Delete, Validations, Duplicate prevention)
- Task 3: Maintenance Reports API (GET /reports/maintenance)
- Task 4 & 5: Celery setup & automatic alert generation task
- Task 6: Comprehensive verification
"""

import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.maintenance import MaintenanceRecord
from app.models.maintenance_alert import MaintenanceAlert
from app.tasks.maintenance_tasks import check_maintenance_schedules
from app.utils.security import create_access_token, hash_password


def run_verification():
    print("=" * 60)
    print("      FLEETFLOW MAINTENANCE ALERTS & REPORTS VERIFICATION      ")
    print("=" * 60)

    # Init DB tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Setup Test Admin User
    admin = db.query(User).filter_by(email="verifier_admin@fleetflow.com").first()
    if not admin:
        admin = User(
            name="Admin Verifier",
            email="verifier_admin@fleetflow.com",
            hashed_password=hash_password("admin123"),
            role="admin"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    token = create_access_token(data={"sub": admin.email, "role": admin.role})
    headers = {"Authorization": f"Bearer {token}"}

    client = TestClient(app)

    # 2. Setup Test Vehicle & Maintenance Record
    v = db.query(Vehicle).filter_by(plate_number="KA-99-TEST-1234").first()
    if not v:
        v = Vehicle(
            plate_number="KA-99-TEST-1234",
            vehicle_type="Truck",
            model="Volvo FH16",
            fuel_type="Diesel",
            capacity_kg=25000.0,
            current_status="available"
        )
        db.add(v)
        db.commit()
        db.refresh(v)

    now = datetime.utcnow()
    m = db.query(MaintenanceRecord).filter_by(vehicle_id=v.id).first()
    if not m:
        m = MaintenanceRecord(
            vehicle_id=v.id,
            category="General Inspection",
            description="Pre-trip safety inspection",
            cost=350.0,
            status="scheduled",
            scheduled_date=now - timedelta(days=1), # Overdue
            next_service_date=now + timedelta(days=2), # Due soon
        )
        db.add(m)
        db.commit()
        db.refresh(m)

    # Clean up any existing alerts for this test maintenance record
    db.query(MaintenanceAlert).filter_by(maintenance_id=m.id).delete()
    db.commit()

    print(f"\n[+] Test Environment Prepared:")
    print(f"    - Vehicle ID     : #{v.id} ({v.plate_number})")
    print(f"    - Maintenance ID : #{m.id} ({m.category})")

    # ── Task 1 & 2: Test Maintenance Alert APIs & Validations ─────────────────────
    print("\n--- Testing Task 2: Maintenance Alert APIs & Validations ---")

    # Validation A: Invalid Vehicle
    res_inv_v = client.post("/maintenance-alerts/", json={
        "vehicle_id": 999999,
        "maintenance_id": m.id,
        "alert_message": "Invalid vehicle test",
        "alert_type": "service_due",
        "alert_status": "Pending"
    }, headers=headers)
    assert res_inv_v.status_code == 404
    print("  [PASS] Invalid Vehicle ID returned 404 as expected")

    # Validation B: Invalid Maintenance
    res_inv_m = client.post("/maintenance-alerts/", json={
        "vehicle_id": v.id,
        "maintenance_id": 999999,
        "alert_message": "Invalid maintenance test",
        "alert_type": "service_due",
        "alert_status": "Pending"
    }, headers=headers)
    assert res_inv_m.status_code == 404
    print("  [PASS] Invalid Maintenance ID returned 404 as expected")

    # API A: Create Alert
    res_create = client.post("/maintenance-alerts/", json={
        "vehicle_id": v.id,
        "maintenance_id": m.id,
        "alert_message": f"Maintenance due for {v.plate_number}",
        "alert_type": "service_due",
        "alert_status": "Pending"
    }, headers=headers)
    assert res_create.status_code == 201, f"Failed: {res_create.json()}"
    alert_data = res_create.json()
    alert_id = alert_data["id"]
    print(f"  [PASS] Created Alert #{alert_id} successfully (Status: {alert_data['alert_status']})")

    # Validation C: Duplicate Pending Alert Prevention
    res_dup = client.post("/maintenance-alerts/", json={
        "vehicle_id": v.id,
        "maintenance_id": m.id,
        "alert_message": "Duplicate test",
        "alert_type": "service_due",
        "alert_status": "Pending"
    }, headers=headers)
    assert res_dup.status_code == 400
    print("  [PASS] Duplicate Pending Alert creation blocked (Returned 400)")

    # API B: Get All Alerts
    res_all = client.get("/maintenance-alerts/", headers=headers)
    assert res_all.status_code == 200
    assert len(res_all.json()) >= 1
    print(f"  [PASS] GET /maintenance-alerts/ returned {len(res_all.json())} alert(s)")

    # API C: Get Alert by ID
    res_single = client.get(f"/maintenance-alerts/{alert_id}", headers=headers)
    assert res_single.status_code == 200
    assert res_single.json()["id"] == alert_id
    print(f"  [PASS] GET /maintenance-alerts/{alert_id} retrieved successfully")

    # API D: Update Alert Status
    res_update = client.patch(f"/maintenance-alerts/{alert_id}", json={
        "alert_status": "Sent"
    }, headers=headers)
    assert res_update.status_code == 200
    assert res_update.json()["alert_status"] == "Sent"
    print(f"  [PASS] PATCH /maintenance-alerts/{alert_id} updated status to Sent")

    # ── Task 3: Test Maintenance Reports API ──────────────────────────────────────
    print("\n--- Testing Task 3: Maintenance Reports API ---")
    res_report = client.get("/reports/maintenance", headers=headers)
    assert res_report.status_code == 200
    rpt = res_report.json()
    print("  [PASS] GET /reports/maintenance returned dynamic metrics:")
    print(f"         - Total Maintenance Records     : {rpt['total_records']}")
    print(f"         - Vehicles Under Maintenance     : {rpt['vehicles_under_maintenance']}")
    print(f"         - Completed Services             : {rpt['completed_services']}")
    print(f"         - Overdue Services               : {rpt['overdue_services']}")
    print(f"         - Total Maintenance Cost         : ${rpt['total_maintenance_cost']}")
    print(f"         - Most Frequent Category         : {rpt['most_frequent_category']}")

    # ── Task 4 & 5: Test Celery Automatic Alert Task ─────────────────────────────
    print("\n--- Testing Tasks 4 & 5: Celery Automatic Alert Task ---")
    # First, mark our previous alert as Completed so the Celery task can generate a new one if due
    client.patch(f"/maintenance-alerts/{alert_id}", json={"alert_status": "Completed"}, headers=headers)

    task_res = check_maintenance_schedules()
    assert task_res["status"] == "success"
    print(f"  [PASS] Celery Task 'check_maintenance_schedules' executed successfully:")
    print(f"         - Checked Records : {task_res['checked_records']}")
    print(f"         - Alerts Created  : {task_res['alerts_created']}")

    # Verification: Check if Celery created the alert for our overdue schedule
    res_alerts_after = client.get(f"/maintenance-alerts/?vehicle_id={v.id}", headers=headers)
    alerts_after = res_alerts_after.json()
    assert len(alerts_after) >= 2
    print(f"  [PASS] Auto-generated Alert found in database for Vehicle #{v.id}")

    # API E: Delete Alert
    del_target = alerts_after[0]["id"]
    res_del = client.delete(f"/maintenance-alerts/{del_target}", headers=headers)
    assert res_del.status_code == 200
    print(f"  [PASS] DELETE /maintenance-alerts/{del_target} removed alert successfully")

    db.close()
    print("\n" + "=" * 60)
    print("   ALL 6 TASKS COMPLETED & VERIFIED 100% SUCCESSFULLY!          ")
    print("=" * 60)


if __name__ == "__main__":
    run_verification()
