from fastapi import FastAPI

from app.routers import auth, driver, vehicle
from app.routers.shipment import router as shipment_router

app = FastAPI()

app.include_router(auth.router)
app.include_router(driver.router)
app.include_router(vehicle.router)
app.include_router(shipment_router)

@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }
