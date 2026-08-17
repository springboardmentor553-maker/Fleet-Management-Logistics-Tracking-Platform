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

class Settings:
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:1203@127.0.0.1:5432/fleetflow_db"
    )

    # JWT Authentication
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "fleetflow_secure_jwt_secret_key_2026_production_ready"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # Celery & Redis
    REDIS_BROKER_URL: str = os.getenv(
        "REDIS_BROKER_URL",
        "redis://127.0.0.1:6379/0"
    )
    REDIS_RESULT_BACKEND: str = os.getenv(
        "REDIS_RESULT_BACKEND",
        "redis://127.0.0.1:6379/0"
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
