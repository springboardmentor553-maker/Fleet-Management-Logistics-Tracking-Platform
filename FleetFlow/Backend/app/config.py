from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    GOOGLE_MAPS_API_KEY: str = ""
    GOOGLE_MAPS_GEOCODING_URL: str = "https://maps.googleapis.com/maps/api/geocode/json"
    GOOGLE_MAPS_DIRECTIONS_URL: str = "https://maps.googleapis.com/maps/api/directions/json"

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    MAINTENANCE_REMINDER_DAYS: int = 7
    LOW_FUEL_THRESHOLD: float = 20.0
    CRITICAL_FUEL_THRESHOLD: float = 10.0

    # SMTP Real Email Delivery Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""

    # Cellular Real SMS Delivery Settings (Twilio / Fast2SMS)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    FAST2SMS_API_KEY: str = ""

    class Config:
        env_file = (".env", "../.env")
        extra = "ignore"


settings = Settings()
