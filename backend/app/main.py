from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth,dashboard,driver,reports,shipment,vehicle
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(driver.router)
app.include_router(reports.router)
app.include_router(shipment.router)
app.include_router(vehicle.router)