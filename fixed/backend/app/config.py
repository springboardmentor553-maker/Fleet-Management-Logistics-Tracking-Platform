import os
from dotenv import load_dotenv

# Resolve directory paths relative to this file
config_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(config_dir)
workspace_dir = os.path.dirname(backend_dir)

# Load .env
load_dotenv(os.path.join(workspace_dir, ".env"))
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv()

import socket

class Settings:
    PROJECT_NAME = "FleetFlow - Fleet Management & Logistics Tracking Platform"

    raw_db_url = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:sriram27@localhost:5432/fleetflow_db"
    )
    if "@postgres:" in raw_db_url:
        try:
            socket.gethostbyname("postgres")
        except socket.gaierror:
            raw_db_url = raw_db_url.replace("@postgres:", "@localhost:").replace(":postgres@", ":sriram27@")

    DATABASE_URL = raw_db_url
    SECRET_KEY = os.getenv("SECRET_KEY", "fleetflow_super_secret_jwt_key_2026")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ]

settings = Settings()

DATABASE_URL = settings.DATABASE_URL