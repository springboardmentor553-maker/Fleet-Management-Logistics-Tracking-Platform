from app.database import engine
from sqlalchemy import text


def migrate_drivers():
    conn = engine.connect()
    trans = conn.begin()

    try:
        # -------------------------------------------------
        # Add user_id
        # -------------------------------------------------

        conn.execute(
            text(
                """
                ALTER TABLE drivers
                ADD COLUMN IF NOT EXISTS user_id INTEGER
                """
            )
        )

        # -------------------------------------------------
        # Add phone_number
        # -------------------------------------------------

        conn.execute(
            text(
                """
                ALTER TABLE drivers
                ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)
                """
            )
        )

        # -------------------------------------------------
        # Add created_at
        # -------------------------------------------------

        conn.execute(
            text(
                """
                ALTER TABLE drivers
                ADD COLUMN IF NOT EXISTS
                created_at TIMESTAMPTZ
                NOT NULL
                DEFAULT CURRENT_TIMESTAMP
                """
            )
        )

        # -------------------------------------------------
        # Add updated_at
        # -------------------------------------------------

        conn.execute(
            text(
                """
                ALTER TABLE drivers
                ADD COLUMN IF NOT EXISTS
                updated_at TIMESTAMPTZ
                NOT NULL
                DEFAULT CURRENT_TIMESTAMP
                """
            )
        )

        # -------------------------------------------------
        # Copy existing phone values
        # -------------------------------------------------

        conn.execute(
            text(
                """
                UPDATE drivers
                SET phone_number = phone
                WHERE phone_number IS NULL
                """
            )
        )

        # -------------------------------------------------
        # Convert existing status values
        # -------------------------------------------------

        conn.execute(
            text(
                """
                UPDATE drivers
                SET status =
                    CASE LOWER(status)
                        WHEN 'available' THEN 'available'
                        WHEN 'busy' THEN 'busy'
                        WHEN 'inactive' THEN 'inactive'
                        ELSE LOWER(status)
                    END
                """
            )
        )

        trans.commit()

        print("Drivers table migrated successfully")

    except Exception:
        trans.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    migrate_drivers()