from fastapi import FastAPI
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
)

from app.websocket.tracking_websocket import router as tracking_websocket_router


# ==========================================================
# FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="FleetFlow API",
    version="1.0.0",
)


# ==========================================================
# CORS CONFIGURATION
# ==========================================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.4:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# API ROUTERS
# ==========================================================

app.include_router(
    auth.router
)

app.include_router(
    driver.router
)

app.include_router(
    vehicle.router
)

app.include_router(
    shipment.router
)

app.include_router(
    dashboard.router
)

app.include_router(
    notification.router
)

app.include_router(
    settings.router
)

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
        "message": "FleetFlow Backend Running Successfully"
    }