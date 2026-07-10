from fastapi import FastAPI
from app.auth import router as auth_router
from app.vehicle import router as vehicle_router
from app.dashboard import router as dashboard_router

app = FastAPI()

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

app.include_router(
    vehicle_router,
    prefix="/vehicles",
    tags=["Vehicles"]
)

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