import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.trip_monitor import trip_monitor

from app.routers import (
    analytics,
    audit_logs,
    dashboard,
    auth,
    driver_assignment,
    driver_attendance,
    drivers,
    fuel,
    maintenance,
    maintenance_alert,
    notifications,
    reports,
    routes,
    trip,
    shipments,
    users,
    vehicles,
    websocket,
)


# =========================================================
# APPLICATION LIFESPAN
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    # -----------------------------------------------------
    # START BACKGROUND TRIP MONITOR
    # -----------------------------------------------------

    monitor_task = asyncio.create_task(
        trip_monitor()
    )

    print(
        "[FLEETFLOW] "
        "Trip background monitor started."
    )

    try:

        yield

    finally:

        # -------------------------------------------------
        # STOP BACKGROUND MONITOR CLEANLY
        # -------------------------------------------------

        monitor_task.cancel()

        try:

            await monitor_task

        except asyncio.CancelledError:

            pass

        print(
            "[FLEETFLOW] "
            "Trip background monitor stopped."
        )


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(

    title=settings.PROJECT_NAME,

    description=(
        "FleetFlow - Fleet Management & Logistics "
        "Tracking Platform Backend APIs"
    ),

    version="1.0.0",

    lifespan=lifespan,
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:5173",

        "http://127.0.0.1:5173",

        "http://localhost:3000",

        "http://127.0.0.1:3000",

    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get(
    "/",
    tags=["Health Check"],
)
def home():

    """
    Health check endpoint to verify that the
    FleetFlow backend is running successfully.
    """

    return {

        "message":
            "FleetFlow Backend Running Successfully"

    }


# =========================================================
# CORE ROUTERS
# =========================================================

app.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"],
)


app.include_router(
    users.router,
    prefix="/users",
    tags=["Users"],
)


app.include_router(
    vehicles.router,
    prefix="/vehicles",
    tags=["Vehicles"],
)


app.include_router(
    drivers.router,
    prefix="/drivers",
    tags=["Drivers"],
)


app.include_router(
    routes.router,
    prefix="/routes",
    tags=["Routes"],
)


app.include_router(
    shipments.router,
    prefix="/shipments",
    tags=["Shipments"],
)


app.include_router(
    maintenance.router,
    prefix="/maintenance",
    tags=["Maintenance"],
)


app.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"],
)


app.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"],
)


# =========================================================
# AUTHENTICATION
# =========================================================

app.include_router(
    auth.router,
)


# =========================================================
# TRIPS
# =========================================================

app.include_router(
    trip.router,
    prefix="/trips",
    tags=["Trips"],
)


# =========================================================
# FLEETFLOW FEATURE ROUTERS
# =========================================================

app.include_router(
    analytics.router,
)


app.include_router(
    audit_logs.router,
)


app.include_router(
    driver_assignment.router,
)


app.include_router(
    driver_attendance.router,
)


app.include_router(
    fuel.router,
)


app.include_router(
    maintenance_alert.router,
)


# =========================================================
# WEBSOCKET
# =========================================================

app.include_router(
    websocket.router
)