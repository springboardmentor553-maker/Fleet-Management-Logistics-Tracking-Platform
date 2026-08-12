from app.database import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE driver_assignments ALTER COLUMN trip_id DROP NOT NULL"))
print("Done - trip_id is now nullable")
