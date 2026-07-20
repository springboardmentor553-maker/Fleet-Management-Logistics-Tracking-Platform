import logging

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.database import test_connection
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.drivers import router as drivers_router
from app.routers.shipments import router as shipments_router
from app.routers.tracking import router as tracking_router
from app.routers.trips import router as trips_router
from app.routers.vehicles import router as vehicles_router

app = FastAPI(title="FleetFlow Backend", version="1.0.0")
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(vehicles_router, prefix="/vehicles", tags=["vehicles"])
app.include_router(drivers_router, prefix="/drivers", tags=["drivers"])
app.include_router(shipments_router, prefix="/shipments", tags=["shipments"])
app.include_router(trips_router, prefix="/trips", tags=["trips"])
app.include_router(tracking_router, tags=["tracking"])
app.include_router(dashboard_router, tags=["dashboard"])


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
