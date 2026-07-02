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