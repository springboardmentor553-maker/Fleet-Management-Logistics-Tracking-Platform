from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.utils.security import get_current_user
from app.routers import (
    analytics,
    auth,
    dashboard,
    driver_assignments,
    driver_attendance,
    drivers,
    fuel,
    maintenance,
    maintenance_alerts,
    notifications,
    reports,
    routes,
    shipments,
    tracking,
    trips,
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
    allow_origins=settings.CORS_ORIGINS,
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


# Public Authentication Endpoints
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Intentionally Public Tracking Endpoints
app.include_router(shipments.tracking_router, tags=["Shipment Tracking"])
app.include_router(tracking.router, tags=["Live Tracking"])

# Protected Management Routers (Require valid JWT access token)
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(get_current_user)])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"], dependencies=[Depends(get_current_user)])
app.include_router(users.router, prefix="/users", tags=["Users"], dependencies=[Depends(get_current_user)])
app.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"], dependencies=[Depends(get_current_user)])
app.include_router(drivers.router, prefix="/drivers", tags=["Drivers"], dependencies=[Depends(get_current_user)])
app.include_router(drivers.performance_router, tags=["Drivers"], dependencies=[Depends(get_current_user)])
app.include_router(driver_assignments.router, prefix="/driver-assignments", tags=["Driver Assignments"], dependencies=[Depends(get_current_user)])
app.include_router(driver_assignments.router, prefix="/assignments", tags=["Driver Assignments"], include_in_schema=False, dependencies=[Depends(get_current_user)])
app.include_router(driver_attendance.router, prefix="/driver-attendance", tags=["Driver Attendance"], dependencies=[Depends(get_current_user)])
app.include_router(routes.router, prefix="/routes", tags=["Routes"], dependencies=[Depends(get_current_user)])
app.include_router(shipments.router, prefix="/shipments", tags=["Shipments"], dependencies=[Depends(get_current_user)])
app.include_router(trips.router, prefix="/trips", tags=["Trips"], dependencies=[Depends(get_current_user)])
app.include_router(trips.route_router, tags=["Trips"], dependencies=[Depends(get_current_user)])
app.include_router(maintenance.router, prefix="/maintenance", tags=["Maintenance"], dependencies=[Depends(get_current_user)])
app.include_router(maintenance_alerts.router, prefix="/maintenance-alerts", tags=["Maintenance Alerts"], dependencies=[Depends(get_current_user)])
app.include_router(maintenance_alerts.router, prefix="/maintenance/alerts", tags=["Maintenance Alerts"], include_in_schema=False, dependencies=[Depends(get_current_user)])
app.include_router(fuel.router, prefix="/fuel", tags=["Fuel Monitoring"], dependencies=[Depends(get_current_user)])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"], dependencies=[Depends(get_current_user)])
app.include_router(reports.router, prefix="/reports", tags=["Reports"], dependencies=[Depends(get_current_user)])



