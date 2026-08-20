from fastapi import FastAPI
from app.routers import auth, driver, vehicle, shipment, dashboard
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    driver,
    vehicle,
    shipment,
    dashboard,
    notification,
    settings,
    trip,
    map,
    fuel_monitoring,
)

from app.websocket.tracking_websocket import (
    router as tracking_websocket_router
)


# ==========================================================
# FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="FleetFlow API",
    version="1.0.0"
)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.4:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# API ROUTERS
# ==========================================================

# Authentication
app.include_router(
    auth.router
)


# Driver Management
app.include_router(
    driver.router
)


# Vehicle Management
app.include_router(
    vehicle.router
)


# Shipment Management
app.include_router(
    shipment.router
)


# Dashboard
app.include_router(
    dashboard.router
)


# Notifications
app.include_router(
    notification.router
)


# Settings
app.include_router(
    settings.router
)


# Trips
app.include_router(
    trip.router
)


# ==========================================================
# MAP ROUTER
# ==========================================================

app.include_router(
    map.router
)


# ==========================================================
# FUEL MONITORING ROUTER
# ==========================================================

app.include_router(
    fuel_monitoring.router
)


# ==========================================================
# WEBSOCKET ROUTER
# ==========================================================

app.include_router(
    tracking_websocket_router
)


# ==========================================================
# HOME ROUTE
# ==========================================================

@app.get("/")
def home():
    return {
        "message":
            "FleetFlow Backend Running Successfully"
    }