from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import os


# ============================================================
# MODELS
# ============================================================

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.fuel import Fuel
from app.models.trip import Trip


# ============================================================
# ROUTERS
# ============================================================

from app.routers import auth
from app.routers import vehicle
from app.routers import dashboard
from app.routers import shipment
from app.routers import trip
from app.routers import websocket
from app.routers import fleet
from app.routers import maintenance
from app.routers import geocoding
from app.routers import route
from app.routers import driver
from app.routers import fuel
from app.routers import driver_assignment
from app.routers import maintenance_reports
from app.routers import analytics
from app.routers import fleet_analytics
from app.routers import fuel_analytics
from app.routers import dashboard_analytics
from app.routers import celery_test
from app.routers import driver_attendance
from app.routers import maintenance_alert
from app.routers import activity
from app.routers import driver_assignment_analytics
from app.routers import operational_analytics
from app.routers import fleet_dashboard
from app.routers import audit


# ============================================================
# AUTH
# ============================================================

from app.utils.auth import admin_required


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Fleet Management API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

# Frontend currently runs on Vite port 5174.
#
# We allow both 5173 and 5174 because Vite may choose either
# port depending on what is already running.
#
# Environment variable can override this in production:
#
# ALLOWED_ORIGINS=https://your-frontend-url.com
#

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:5174",
    "http://127.0.0.1:5174",
]


environment_origins = os.getenv(
    "ALLOWED_ORIGINS",
    ""
).strip()


if environment_origins:

    ALLOWED_ORIGINS = [
        origin.strip().rstrip("/")
        for origin in environment_origins.split(",")
        if origin.strip()
    ]

else:

    ALLOWED_ORIGINS = default_origins


print("========================================")
print("CORS CONFIGURATION")
print("========================================")

for origin in ALLOWED_ORIGINS:
    print("Allowed origin:", origin)

print("========================================")


app.add_middleware(
    CORSMiddleware,

    allow_origins=ALLOWED_ORIGINS,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth.router
)

app.include_router(
    vehicle.router
)

app.include_router(
    dashboard.router
)

app.include_router(
    shipment.router
)

app.include_router(
    trip.router
)

app.include_router(
    websocket.router
)

app.include_router(
    fleet.router
)

app.include_router(
    maintenance.router
)

app.include_router(
    geocoding.router
)

app.include_router(
    route.router
)

app.include_router(
    driver.router
)

app.include_router(
    fuel.router
)

app.include_router(
    driver_assignment.router
)

app.include_router(
    maintenance_reports.router
)

app.include_router(
    analytics.router
)

app.include_router(
    fleet_analytics.router
)

app.include_router(
    fuel_analytics.router
)

app.include_router(
    dashboard_analytics.router
)

app.include_router(
    celery_test.router
)

app.include_router(
    driver_attendance.router
)

app.include_router(
    maintenance_alert.router
)

app.include_router(
    activity.router
)

app.include_router(
    driver_assignment_analytics.router
)

app.include_router(
    operational_analytics.router
)

app.include_router(
    fleet_dashboard.router
)

app.include_router(
    audit.router
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Fleet Management API is running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "Fleet Management API"
    }


# ============================================================
# ADMIN
# ============================================================

@app.get("/admin")
def admin_dashboard(
    user=Depends(admin_required)
):

    return {
        "message": "Welcome Admin!",
        "user": user
    }