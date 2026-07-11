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

class Settings:
    PROJECT_NAME = "FleetFlow - Fleet Management & Logistics Tracking Platform"

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/fleetflow_db"
    )

settings = Settings()

DATABASE_URL = settings.DATABASE_URL