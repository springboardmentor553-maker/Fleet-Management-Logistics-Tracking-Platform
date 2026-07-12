from fastapi import FastAPI, Depends

from app.routers import auth
from app.routers import vehicle
from app.utils.auth import admin_required
from app.routers import dashboard
from app.routers import shipment
from app.models.trip import Trip
from app.routers import trip
from app.routers import websocket
from app.routers import fleet

app = FastAPI(title="Fleet Management API")

app.include_router(auth.router)
app.include_router(vehicle.router)
app.include_router(dashboard.router)
app.include_router(shipment.router)
app.include_router(trip.router)
app.include_router(websocket.router)
app.include_router(fleet.router)

@app.get("/")
def home():
    return {"message": "Fleet Management API is running"}


@app.get("/admin")
def admin_dashboard(user=Depends(admin_required)):
    return {
        "message": "Welcome Admin!",
        "user": user
    }