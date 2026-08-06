from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.vehicle import router as vehicle_router
from app.driver import router as driver_router
from app.shipment import router as shipment_router
from app.dashboard import router as dashboard_router
from app.trip import router as trip_router
from app.maintenance import router as maintenance_router
from app.driver_assignment import router as driver_assignment_router
from app.fuel_record import router as fuel_record_router
from app.analytics import router as analytics_router
from app.maintenance_alert import router as maintenance_alert_router
from app.report import router as report_router

app = FastAPI(
    title="FleetFlow API",
    version="1.0.0",
    description="Fleet Management and Logistics Tracking Platform API"
)

# Allow React frontend to access FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Routes
app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

# Fleet Management
app.include_router(
    vehicle_router,
    prefix="/vehicles",
    tags=["Vehicles"]
)

app.include_router(
    driver_router,
    prefix="/drivers",
    tags=["Drivers"],
)

app.include_router(
    shipment_router,
    prefix="/shipments",
    tags=["Shipments"]
)

app.include_router(
    trip_router,
    prefix="/trips",
    tags=["Trips"]
)

app.include_router(
    maintenance_router,
    prefix="/maintenance",
    tags=["Maintenance"]
)

app.include_router(
    driver_assignment_router,
    prefix="/driver-assignments",
    tags=["Driver Assignments"]
)

app.include_router(
    fuel_record_router,
    prefix="/fuel-records",
    tags=["Fuel Records"]
)

app.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["Analytics"]
)

app.include_router(
    maintenance_alert_router,
    prefix="/maintenance-alerts",
    tags=["Maintenance Alerts"]
)

app.include_router(
    report_router,
    prefix="/reports",
    tags=["Reports"]
)

#Dashboard
app.include_router(
    dashboard_router,
    prefix="/dashboard",
    tags=["Dashboard"]
)

@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }