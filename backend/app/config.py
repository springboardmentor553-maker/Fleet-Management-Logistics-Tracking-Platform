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

    _raw_db_url: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/fleetflow_db"
    )

    @property
    def DATABASE_URL(self) -> str:
        if self._raw_db_url and self._raw_db_url.startswith("postgres://"):
            return self._raw_db_url.replace("postgres://", "postgresql://", 1)
        return self._raw_db_url

    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_change_me_in_production_1234567890")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "YOUR_KEY")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    
    ALLOWED_ORIGINS_RAW: str = os.getenv("ALLOWED_ORIGINS", "")
    
    @property
    def ALLOWED_ORIGINS(self) -> list[str]:
        origins = []
        if self.ALLOWED_ORIGINS_RAW:
            origins.extend([origin.strip() for origin in self.ALLOWED_ORIGINS_RAW.split(",") if origin.strip()])
        if self.FRONTEND_URL and self.FRONTEND_URL.strip() not in origins:
            origins.append(self.FRONTEND_URL.strip())
        if not origins:
            return [
                "http://localhost", 
                "http://localhost:5173", 
                "http://localhost:80", 
                "http://localhost:8000",
                "http://127.0.0.1",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:8000"
            ]
        return list(set(origins))

settings = Settings()

DATABASE_URL = settings.DATABASE_URL