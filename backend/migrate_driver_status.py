from app.database import engine
from sqlalchemy import text


conn = engine.connect()
trans = conn.begin()

try:
    # Old statuses -> new status
    conn.execute(
        text(
            """
            UPDATE drivers
            SET status = 'on_trip'
            WHERE LOWER(status) IN ('busy', 'assigned')
            """
        )
    )

    trans.commit()

    print("Driver statuses migrated successfully")

except Exception:
    trans.rollback()
    raise

finally:
    conn.close()