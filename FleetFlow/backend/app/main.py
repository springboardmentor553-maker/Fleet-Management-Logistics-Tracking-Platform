from fastapi import FastAPI

from app.routers import dashboard
from app.routers import driver
from app.routers import shipment
from app.routers import user
from app.routers import vehicle
from app.routers import trip
from app.routers import maps
from app.routers import websocket

app = FastAPI()

app.include_router(user.router)
app.include_router(driver.router)
app.include_router(vehicle.router)
app.include_router(shipment.router)
app.include_router(dashboard.router)
app.include_router(trip.router)
app.include_router(maps.router)
app.include_router(websocket.router)

@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }