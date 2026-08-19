<<<<<<< HEAD
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.orm import Session

DATABASE_URL =os.getenv("DATABASE_URL")
=======
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
<<<<<<< HEAD
Base = declarative_base()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
=======

Base = declarative_base()
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
