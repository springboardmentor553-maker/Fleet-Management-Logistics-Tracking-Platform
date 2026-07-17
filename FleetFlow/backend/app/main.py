from fastapi import FastAPI

from app.routers import dashboard
from app.routers import driver
from app.routers import shipment
from app.routers import user
from app.routers import vehicle

app = FastAPI()

app.include_router(user.router)
app.include_router(driver.router)
app.include_router(vehicle.router)
app.include_router(shipment.router)
app.include_router(dashboard.router)

@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }