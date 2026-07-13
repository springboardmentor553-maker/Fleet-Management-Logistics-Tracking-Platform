from fastapi import FastAPI, Depends
from backend.app.routers.dashboard import router as dashboard_router
from backend.app.routers.driver import router as driver_router

from backend.app.routers.auth import router as auth_router
from backend.app.routers.vehicle import router as vehicle_router
from backend.app.routers.shipment import router as shipment_router
from backend.app.models.shipment_history import ShipmentHistory

from backend.app.dependencies import get_current_user
from backend.app.role_checker import role_required


app = FastAPI(title="FleetFlow API")

app.include_router(auth_router)
app.include_router(vehicle_router)
app.include_router(dashboard_router)
app.include_router(driver_router)
app.include_router(shipment_router)


@app.get("/")
def home():
    return {"message": "Welcome to FleetFlow"}


@app.get("/profile")
def profile(current_user=Depends(get_current_user)):
    return {
        "message": "Protected Route",
        "user": current_user
    }


@app.get("/admin")
def admin_dashboard(current_user=Depends(role_required(["Admin"]))):
    return {
        "message": "Welcome Admin",
        "user": current_user
    }