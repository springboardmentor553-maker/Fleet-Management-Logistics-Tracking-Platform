from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:FleetFlow%40Info@localhost:5432/fleetflow_db"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
try:
    with engine.connect() as connection:
        print("Database connected successfully!")
except Exception as e:
    print("Connection failed:", e)