from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    dashboard,
    drivers,
    maintenance,
    notifications,
    reports,
    routes,
    shipments,
    users,
    vehicles,
)

# Initialize the FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FleetFlow - Fleet Management & Logistics Tracking Platform Backend APIs",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health Check"])
def home():
    """
    Health check endpoint to verify that the FleetFlow backend is running successfully.
    """
    return {
        "message": "FleetFlow Backend Running Successfully"
    }


app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])
app.include_router(drivers.router, prefix="/drivers", tags=["Drivers"])
app.include_router(routes.router, prefix="/routes", tags=["Routes"])
app.include_router(shipments.router, prefix="/shipments", tags=["Shipments"])
app.include_router(maintenance.router, prefix="/maintenance", tags=["Maintenance"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
