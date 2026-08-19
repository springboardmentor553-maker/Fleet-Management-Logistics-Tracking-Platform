from sqlalchemy import text
from app.database import engine


with engine.connect() as conn:
    rows = conn.execute(
        text(
            """
            SELECT enumlabel
            FROM pg_enum
            WHERE enumtypid = 'vehicle_status'::regtype
            ORDER BY enumsortorder
            """
        )
    ).fetchall()

    print("Vehicle status enum values:")
    for row in rows:
        print(row[0])