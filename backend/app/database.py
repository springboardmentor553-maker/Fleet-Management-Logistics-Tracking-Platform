from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create the SQLAlchemy engine using the database connection URL from settings
engine = create_engine(
    settings.DATABASE_URL
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for Declarative models
Base = declarative_base()

def get_db():
    """
    Dependency generator for database sessions.
    Ensures that database sessions are properly closed after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
