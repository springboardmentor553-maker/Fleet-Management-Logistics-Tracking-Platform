import os
import sys
from sqlalchemy import create_engine, inspect

database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("DATABASE_URL environment variable is not set.")
    sys.exit(1)

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(database_url)
    inspector = inspect(engine)
    
    has_alembic = inspector.has_table("alembic_version")
    has_drivers = inspector.has_table("drivers")
    
    if has_drivers and not has_alembic:
        print("Existing tables found but no alembic_version table. Stamping head...")
        # Note: using os.system for simplicity, checking its return code
        ret = os.system("python -m alembic stamp head")
        if ret != 0:
            sys.exit(ret)
    else:
        print("Running standard alembic upgrade head...")
        ret = os.system("python -m alembic upgrade head")
        if ret != 0:
            sys.exit(ret)
except Exception as e:
    print(f"Error during migration pre-check: {e}")
    sys.exit(1)
