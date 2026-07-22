"""
Inspect the actual PostgreSQL enum labels for shipmentstatus.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT enumlabel
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'shipmentstatus'
        ORDER BY pg_enum.enumsortorder
    """))
    labels = [row[0] for row in result]
    print("PostgreSQL enum labels for 'shipmentstatus':")
    for label in labels:
        print(f"  '{label}'")

    # Also check what's currently in the column
    print("\nCurrent distinct values in shipments.current_status column:")
    result2 = conn.execute(text(
        "SELECT DISTINCT current_status FROM shipments"
    ))
    for row in result2:
        print(f"  '{row[0]}'")
