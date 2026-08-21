from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import dashboard
from app.routers import driver
from app.routers import shipment
from app.routers import user
from app.routers import vehicle
from app.routers import trip
from app.routers import maps
from app.routers import websocket
from app.routers import maintenance
from app.routers import driver_assignment
from app.routers import driver_attendance
from app.routers import fuel_record
from app.routers import fuel_analytics
from app.routers import fleet_dashboard
from app.routers import operational_analytics
from app.routers import maintenance_alert


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://fleetflow-frontend-jsqv.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user.router)
app.include_router(driver.router)
app.include_router(vehicle.router)
app.include_router(shipment.router)
app.include_router(dashboard.router)
app.include_router(trip.router)
app.include_router(maps.router)
app.include_router(websocket.router)
app.include_router(maintenance.router)
app.include_router(driver_assignment.router)
app.include_router(driver_attendance.router)
app.include_router(fuel_record.router)
app.include_router(fuel_analytics.router)
app.include_router(fleet_dashboard.router)
app.include_router(operational_analytics.router)
app.include_router(maintenance_alert.router)


@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }