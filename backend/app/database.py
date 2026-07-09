from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://postgres:password@localhost:5432/fleetflow_db"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

try:
    with engine.connect() as connection:
        print("Database connected successfully!")
except Exception as e:
    print("Connection failed!")
    print(e)
