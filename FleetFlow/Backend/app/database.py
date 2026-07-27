import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def init_db():
    import app.models 
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)

    # 1. Check and add missing columns for 'drivers' table
    if inspector.has_table("drivers"):
        existing_cols = {col["name"] for col in inspector.get_columns("drivers")}
        columns_to_add = [
            ("assigned_vehicle_id", "INTEGER REFERENCES vehicles(id)"),
            ("attendance_status", "VARCHAR DEFAULT 'present'"),
            ("safety_score", "INTEGER DEFAULT 95"),
            ("completed_trips_count", "INTEGER DEFAULT 0"),
            ("total_distance_km", "FLOAT DEFAULT 0.0"),
            ("rating", "FLOAT DEFAULT 4.8"),
        ]
        with engine.begin() as conn:
            for col_name, col_def in columns_to_add:
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE drivers ADD COLUMN {col_name} {col_def}"))
                    except Exception as e:
                        print(f"Migration notice for drivers.{col_name}: {e}")

    # 2. Check and add missing columns for 'vehicles' table
    if inspector.has_table("vehicles"):
        existing_cols = {col["name"] for col in inspector.get_columns("vehicles")}
        columns_to_add = [
            ("assigned_driver_id", "INTEGER REFERENCES drivers(id)"),
            ("current_status", "VARCHAR DEFAULT 'available'"),
            ("latitude", "FLOAT"),
            ("longitude", "FLOAT"),
        ]
        with engine.begin() as conn:
            for col_name, col_def in columns_to_add:
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE vehicles ADD COLUMN {col_name} {col_def}"))
                    except Exception as e:
                        print(f"Migration notice for vehicles.{col_name}: {e}")

    # 3. Check and add missing columns for 'shipments' table
    if inspector.has_table("shipments"):
        existing_cols = {col["name"] for col in inspector.get_columns("shipments")}
        columns_to_add = [
            ("origin_lat", "FLOAT"),
            ("origin_lng", "FLOAT"),
            ("destination_lat", "FLOAT"),
            ("destination_lng", "FLOAT"),
            ("driver_id", "INTEGER REFERENCES drivers(id)"),
            ("vehicle_id", "INTEGER REFERENCES vehicles(id)"),
            ("delivered_at", "TIMESTAMP"),
        ]
        with engine.begin() as conn:
            for col_name, col_def in columns_to_add:
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE shipments ADD COLUMN {col_name} {col_def}"))
                    except Exception as e:
                        print(f"Migration notice for shipments.{col_name}: {e}")

    # 4. Check and add missing columns for 'trips' table
    if inspector.has_table("trips"):
        existing_cols = {col["name"] for col in inspector.get_columns("trips")}
        columns_to_add = [
            ("pickup_latitude", "FLOAT"),
            ("pickup_longitude", "FLOAT"),
            ("destination_latitude", "FLOAT"),
            ("destination_longitude", "FLOAT"),
        ]
        with engine.begin() as conn:
            for col_name, col_def in columns_to_add:
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE trips ADD COLUMN {col_name} {col_def}"))
                    except Exception as e:
                        print(f"Migration notice for trips.{col_name}: {e}")