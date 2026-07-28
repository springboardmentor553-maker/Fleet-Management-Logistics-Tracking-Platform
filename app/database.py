from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session 

import os



DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:Ash843@localhost:5432/fleetflow_db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
from sqlalchemy import text

def test_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database connected successfully!")
    except Exception as e:
        print(f"Database connection failed: {e}")