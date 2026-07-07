from fastapi import FastAPI
from app.auth import router as auth_router
from app.routers.driver import router as driver_router
from app.routers.vehicle import router as vehicle_router
from app.routers.shipment import router as shipment_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router
from app.database import Base, engine
from app import models
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }