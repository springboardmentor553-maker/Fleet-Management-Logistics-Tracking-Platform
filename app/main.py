from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth
from app.routers import vehicle
from app.routers import dashboard
from app.routers import driver
from app.routers import shipment
from app.routers import route
from app.routers import reports
from app.routers import notification
from app.routers import maintenance
from app.routers import delivery
from app.routers import trip
from app.routers import geocoding
from app.routers import routing
from app.routers import websocket
from app.config import settings
from app.database import test_connection


app = FastAPI(title=settings.APP_NAME)
app.include_router(auth.router)
app.include_router(vehicle.router)
app.include_router(dashboard.router)
app.include_router(driver.router)
app.include_router(shipment.router)
app.include_router(route.router)
app.include_router(reports.router)
app.include_router(notification.router)
app.include_router(maintenance.router)
app.include_router(delivery.router)
app.include_router(trip.router)
app.include_router(geocoding.router)
app.include_router(routing.router)
app.include_router(websocket.router)
@app.get("/")
def read_root():
    return {"message": f"{settings.APP_NAME} is running", "env": settings.ENV}


@app.get("/health/db")
def check_db():
    ok = test_connection()
    return {"database_connected": ok}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)