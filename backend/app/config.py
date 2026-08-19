import os
from pathlib import Path
from dotenv import load_dotenv

# Locate project root directory containing .env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

_INSECURE_DEFAULT_KEY = "change_this_default_secret_key_in_production"

class Settings:
    # Environment — set ENV=production in cloud deployments
    ENV: str = os.getenv("ENV", "development")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@postgres:5432/fleetflow_db"
    )

    # JWT Authentication
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        _INSECURE_DEFAULT_KEY
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # Celery & Redis
    REDIS_BROKER_URL: str = os.getenv(
        "REDIS_BROKER_URL",
        "redis://redis:6379/0"
    )
    REDIS_RESULT_BACKEND: str = os.getenv(
        "REDIS_RESULT_BACKEND",
        "redis://redis:6379/0"
    )

    # CORS Allowed Origins
    @property
    def cors_origins_list(self) -> list:
        origins_raw = os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:80,http://127.0.0.1:80,http://localhost:3000,http://127.0.0.1:3000"
        )
        return [origin.strip() for origin in origins_raw.split(",") if origin.strip()]

settings = Settings()

# Startup guard: block insecure default key in production
if settings.ENV == "production" and settings.SECRET_KEY == _INSECURE_DEFAULT_KEY:
    raise RuntimeError(
        "SECRET_KEY must be set to a strong random value in production. "
        "Set the SECRET_KEY environment variable."
    )
