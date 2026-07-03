import os
from dotenv import load_dotenv

# Resolve directory paths relative to this file (config.py is in backend/app)
config_dir = os.path.dirname(os.path.abspath(__file__))  # backend/app
backend_dir = os.path.dirname(config_dir)                # backend
workspace_dir = os.path.dirname(backend_dir)             # workspace root

# Load .env file from possible locations (workspace root or backend folder)
load_dotenv(os.path.join(workspace_dir, ".env"))
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv()  # Fallback to current working directory

class Settings:
    """
    Application settings and configurations.
    Loads variables from the environment or .env file.
    """
    PROJECT_NAME: str = "FleetFlow - Fleet Management & Logistics Tracking Platform"
    
    # Retrieve the database URL, default to local postgres if not set
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/fleetflow_db"
    )

# Instantiate settings
settings = Settings()
