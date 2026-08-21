import os

from dotenv import load_dotenv


load_dotenv()


# ============================================================
# DATABASE
# ============================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/fleetflow",
)


# ============================================================
# AUTHENTICATION
# ============================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "change-this-secret-key",
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256",
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60",
    )
)


# ============================================================
# GOOGLE MAPS
# ============================================================

GOOGLE_MAPS_API_KEY = os.getenv(
    "GOOGLE_MAPS_API_KEY",
    "",
)


# ============================================================
# REDIS
# ============================================================

REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0",
)


# ============================================================
# FRONTEND / CORS
# ============================================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)


# Optional comma-separated list of additional allowed origins.
#
# Example:
# CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
#
# In production:
# CORS_ORIGINS=https://your-fleetflow-frontend.example.com
#
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "",
)


def get_cors_origins():
    """
    Build the list of allowed frontend origins.

    FRONTEND_URL is always included.
    Additional origins can be supplied through CORS_ORIGINS.
    """

    origins = []

    if FRONTEND_URL:
        origins.append(
            FRONTEND_URL.strip().rstrip("/")
        )

    if CORS_ORIGINS:
        origins.extend(
            origin.strip().rstrip("/")
            for origin in CORS_ORIGINS.split(",")
            if origin.strip()
        )

    # Remove duplicates while preserving order.
    return list(
        dict.fromkeys(origins)
    )


# ============================================================
# NOTIFICATION CONFIGURATION
# ============================================================

EMAIL_NOTIFICATIONS_ENABLED = os.getenv(
    "EMAIL_NOTIFICATIONS_ENABLED",
    "false",
)


SMS_NOTIFICATIONS_ENABLED = os.getenv(
    "SMS_NOTIFICATIONS_ENABLED",
    "false",
)


PUSH_NOTIFICATIONS_ENABLED = os.getenv(
    "PUSH_NOTIFICATIONS_ENABLED",
    "false",
)


# ============================================================
# EMAIL / SMTP
# ============================================================

SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "",
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587",
    )
)

SMTP_USERNAME = os.getenv(
    "SMTP_USERNAME",
    "",
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD",
    "",
)

SMTP_FROM_EMAIL = os.getenv(
    "SMTP_FROM_EMAIL",
    "",
)


# ============================================================
# SMS / TWILIO
# ============================================================

TWILIO_ACCOUNT_SID = os.getenv(
    "TWILIO_ACCOUNT_SID",
    "",
)

TWILIO_AUTH_TOKEN = os.getenv(
    "TWILIO_AUTH_TOKEN",
    "",
)

TWILIO_FROM_NUMBER = os.getenv(
    "TWILIO_FROM_NUMBER",
    "",
)


# ============================================================
# PUSH NOTIFICATIONS / VAPID
# ============================================================

VAPID_PUBLIC_KEY = os.getenv(
    "VAPID_PUBLIC_KEY",
    "",
)

VAPID_PRIVATE_KEY = os.getenv(
    "VAPID_PRIVATE_KEY",
    "",
)

VAPID_CLAIMS_EMAIL = os.getenv(
    "VAPID_CLAIMS_EMAIL",
    "mailto:admin@fleetflow.local",
)