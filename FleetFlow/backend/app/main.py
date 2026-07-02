import logging

from fastapi import FastAPI, HTTPException

from app.database import test_connection

app = FastAPI(title="FleetFlow Backend")
logger = logging.getLogger(__name__)


@app.on_event("startup")
def startup_database_check() -> None:
    try:
        test_connection()
    except RuntimeError as exc:
        logger.warning("Database connection check failed during startup: %s", exc)


@app.get("/")
def home() -> dict[str, str]:
    return {"message": "FleetFlow Backend Running Successfully"}


@app.get("/health/db")
def database_health() -> dict[str, str]:
    try:
        test_connection()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"status": "database connected"}
