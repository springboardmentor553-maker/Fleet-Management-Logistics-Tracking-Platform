from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.vehicle import router as vehicle_router
from app.driver import router as driver_router
from app.shipment import router as shipment_router
from app.dashboard import router as dashboard_router

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