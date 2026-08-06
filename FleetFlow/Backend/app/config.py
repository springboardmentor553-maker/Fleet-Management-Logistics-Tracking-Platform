from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    GOOGLE_MAPS_API_KEY: str = ""
    GOOGLE_MAPS_GEOCODING_URL: str = "https://maps.googleapis.com/maps/api/geocode/json"
    GOOGLE_MAPS_DIRECTIONS_URL: str = "https://maps.googleapis.com/maps/api/directions/json"

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    MAINTENANCE_REMINDER_DAYS: int = 7

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
