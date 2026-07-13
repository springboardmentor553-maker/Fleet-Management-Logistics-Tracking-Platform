from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, driver, vehicle
from app.routers.shipment import router as shipment_router

app = FastAPI(
    title="FleetFlow API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(driver.router)
app.include_router(vehicle.router)
app.include_router(shipment_router)

@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }