import os
from dotenv import load_dotenv

# Resolve directory paths relative to this file
config_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(config_dir)
workspace_dir = os.path.dirname(backend_dir)

# Load .env files
load_dotenv(os.path.join(workspace_dir, ".env"))
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv()


class Settings:
    PROJECT_NAME = "FleetFlow - Fleet Management & Logistics Tracking Platform"

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/fleetflow_db"
    )

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "YOUR_LONG_RANDOM_JWT_SECRET"
    )

    ALGORITHM = os.getenv(
        "ALGORITHM",
        "HS256"
    )

    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv(
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            "30"
        )
    )


settings = Settings()

DATABASE_URL = settings.DATABASE_URL
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES