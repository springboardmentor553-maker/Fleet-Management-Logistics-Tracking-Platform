import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import test_connection
from app.routers import (
    auth,
    dashboard,
    delivery,
    driver,
    driver_assignment,
    driver_attendance,
    fleet_dashboard,
    fuel_analytics,
    fuel_record,
    geocoding,
    maintenance,
    maintenance_alert,
    maintenance_reports,
    notification,
    operation_analytics,
    reports,
    route,
    routing,
    shipment,
    trip,
    vehicle,
    websocket,
)

app = FastAPI(title=settings.APP_NAME)
app.include_router(auth.router)
app.include_router(vehicle.router)
app.include_router(dashboard.router)
app.include_router(driver.router)
app.include_router(shipment.router)
app.include_router(route.router)
app.include_router(reports.router)
app.include_router(notification.router)
app.include_router(maintenance.router)
app.include_router(delivery.router)
app.include_router(trip.router)
app.include_router(geocoding.router)
app.include_router(routing.router)
app.include_router(websocket.router)
app.include_router(driver_attendance.router)
app.include_router(driver_assignment.router)
app.include_router(fuel_record.router)
app.include_router(fuel_analytics.router)
app.include_router(fleet_dashboard.router)
app.include_router(operation_analytics.router)
app.include_router(maintenance_alert.router)
app.include_router(maintenance_reports.router)
@app.get("/")
def read_root():
    return {"message": f"{settings.APP_NAME} is running", "env": settings.ENV}


@app.get("/health/db")
def check_db():
    ok = test_connection()
    return {"database_connected": ok}


CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)

allowed_origins = [
    origin.strip()
    for origin in CORS_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)