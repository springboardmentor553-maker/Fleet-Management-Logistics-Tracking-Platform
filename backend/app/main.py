from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from app.routers import trip
from app.routers.driver import router as driver_router
from app.routers.vehicle import router as vehicle_router
from app.routers.shipment import router as shipment_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router
from app.database import Base, engine
from app import models
from fastapi.middleware.cors import CORSMiddleware
from app.routers import route
from app.routers.websocket import router as websocket_router
from app.routers import maintenance
from app.routers import driver_assignment
from app.routers import driver_performance
from app.routers import driver_attendance
from app.routers import fuel_record
from app.routers import maintenance_alert





Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://fleetflow-frontend-kiyjpx6i-madhupriya-17s-projects.vercel.app",

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(driver_router)
app.include_router(vehicle_router)
app.include_router(shipment_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(trip.router)
app.include_router(route.router)
app.include_router(websocket_router)
app.include_router(maintenance.router)
app.include_router(driver_assignment.router)
app.include_router(driver_performance.router) 
app.include_router(driver_attendance.router)
app.include_router(fuel_record.router)
app.include_router(maintenance_alert.router)

@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }