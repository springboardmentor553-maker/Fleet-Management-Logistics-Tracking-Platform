from dataclasses import dataclass
import os

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    postgres_user: str = os.getenv("POSTGRES_USER", "postgres")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    postgres_host: str = os.getenv("POSTGRES_HOST", "localhost")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", "5432"))
    postgres_db: str = os.getenv("POSTGRES_DB", "fleetflow_db")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "fleetflow-access-secret-key")
    jwt_refresh_secret_key: str = os.getenv(
        "JWT_REFRESH_SECRET_KEY",
        "fleetflow-refresh-secret-key",
    )
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    google_maps_api_key: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    database_url: str = os.getenv(
        "DATABASE_URL",
        (
            "postgresql+psycopg2://"
            f"{os.getenv('POSTGRES_USER', 'postgres')}:"
            f"{os.getenv('POSTGRES_PASSWORD', 'postgres')}@"
            f"{os.getenv('POSTGRES_HOST', 'localhost')}:"
            f"{int(os.getenv('POSTGRES_PORT', '5432'))}/"
            f"{os.getenv('POSTGRES_DB', 'fleetflow_db')}"
        ),
    )


settings = Settings()