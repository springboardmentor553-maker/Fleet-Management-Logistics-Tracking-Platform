"""
Fix: Re-cast the shipments.current_status column back to shipmentstatus enum.
The column was left as TEXT after a failed migration attempt.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    with conn.begin():
        # Check the current column type
        result = conn.execute(text("""
            SELECT data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = 'shipments' AND column_name = 'current_status'
        """))
        row = result.fetchone()
        print(f"Current column type: data_type={row[0]}, udt_name={row[1]}")

        if row[0] == 'text' or row[1] != 'shipmentstatus':
            print("Column is TEXT, re-casting to shipmentstatus enum...")
            conn.execute(text(
                "ALTER TABLE shipments "
                "ALTER COLUMN current_status TYPE shipmentstatus "
                "USING current_status::shipmentstatus"
            ))
            print("Done! Column is now shipmentstatus enum type.")
        else:
            print("Column is already shipmentstatus enum type. No action needed.")
