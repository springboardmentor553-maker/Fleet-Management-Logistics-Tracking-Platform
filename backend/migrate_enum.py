"""
One-time migration script to fix the shipmentstatus enum mismatch.

The PostgreSQL enum type 'shipmentstatus' was created with uppercase labels
(CREATED, ASSIGNED, PICKED_UP, etc.) but existing rows may have title-case
values (Created, Assigned, Picked Up, etc.) stored as raw strings.

This script:
1. Temporarily alters the column to TEXT
2. Updates all old title-case values to uppercase
3. Re-casts the column back to the enum type

Run once from the backend directory:
    python migrate_enum.py
"""

import sys
import os

# Make sure the app package is importable
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine

STATUS_MAPPING = {
    "Created":          "CREATED",
    "Assigned":         "ASSIGNED",
    "Picked Up":        "PICKED_UP",
    "In Transit":       "IN_TRANSIT",
    "Out for Delivery": "OUT_FOR_DELIVERY",
    "Delivered":        "DELIVERED",
    "Delayed":          "DELAYED",
    "Cancelled":        "CANCELLED",
}

def run():
    with engine.connect() as conn:
        with conn.begin():
            print("Step 1: Altering column to TEXT to allow free-form updates...")
            conn.execute(text(
                "ALTER TABLE shipments ALTER COLUMN current_status TYPE TEXT"
            ))

            print("Step 2: Updating title-case values to uppercase...")
            for old_val, new_val in STATUS_MAPPING.items():
                result = conn.execute(text(
                    "UPDATE shipments SET current_status = :new WHERE current_status = :old"
                ), {"new": new_val, "old": old_val})
                if result.rowcount:
                    print(f"  '{old_val}' -> '{new_val}': {result.rowcount} rows updated")

            print("Step 3: Re-casting column back to shipmentstatus enum...")
            conn.execute(text(
                "ALTER TABLE shipments "
                "ALTER COLUMN current_status TYPE shipmentstatus "
                "USING current_status::shipmentstatus"
            ))

        print("\n✅ Migration complete! All shipment statuses are now uppercase.")

if __name__ == "__main__":
    run()
