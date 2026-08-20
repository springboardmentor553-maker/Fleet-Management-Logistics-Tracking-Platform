from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings


DATABASE_URL = settings.DATABASE_URL

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")


connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def test_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        print("Database connected successfully!")
        return True

    except Exception as e:
        print(f"Database connection failed: {e}")
        return False