import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Create a local .env file before running the app.")

# OpenRouteService – read from .env; warn at startup if absent (not fatal so the
# rest of the app can still run, but /route endpoints will fail at call-time).
ORS_API_KEY: str | None = os.getenv("ORS_API_KEY")

# Nominatim requires a descriptive User-Agent string per their usage policy.
NOMINATIM_USER_AGENT: str = os.getenv("NOMINATIM_USER_AGENT", "FleetFlow/1.0 (fleet-logistics-app)")