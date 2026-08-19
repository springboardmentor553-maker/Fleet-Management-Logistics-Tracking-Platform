from sqlalchemy import text
from app.database import engine


def migrate_vehicles():
    with engine.begin() as conn:

        # Rename old columns
        conn.execute(text("""
            ALTER TABLE vehicles
            RENAME COLUMN vehicle_number TO license_plate
        """))

        conn.execute(text("""
            ALTER TABLE vehicles
            RENAME COLUMN vehicle_type TO make
        """))

        conn.execute(text("""
            ALTER TABLE vehicles
            RENAME COLUMN capacity TO capacity_weight
        """))

        # Add columns required by the current Vehicle model
        conn.execute(text("""
            ALTER TABLE vehicles
            ADD COLUMN IF NOT EXISTS year INTEGER
            NOT NULL DEFAULT 2026
        """))

        conn.execute(text("""
            ALTER TABLE vehicles
            ADD COLUMN IF NOT EXISTS vin VARCHAR(17)
        """))

        conn.execute(text("""
            ALTER TABLE vehicles
            ADD COLUMN IF NOT EXISTS capacity_volume FLOAT
        """))

        conn.execute(text("""
            ALTER TABLE vehicles
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ
            NOT NULL DEFAULT CURRENT_TIMESTAMP
        """))

        conn.execute(text("""
            ALTER TABLE vehicles
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ
            NOT NULL DEFAULT CURRENT_TIMESTAMP
        """))

        # Convert old status values to the current VehicleStatus values
        conn.execute(text("""
            UPDATE vehicles
            SET status = CASE
                WHEN LOWER(status) = 'available'
                    THEN 'active'
                WHEN LOWER(status) = 'busy'
                    THEN 'active'
                WHEN LOWER(status) = 'under maintenance'
                    THEN 'maintenance'
                WHEN LOWER(status) = 'inactive'
                    THEN 'inactive'
                ELSE 'inactive'
            END
        """))

    print("Vehicles table migrated successfully")


if __name__ == "__main__":
    migrate_vehicles()