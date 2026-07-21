from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth
from app.routers import vehicle
from app.routers import dashboard
from app.routers import shipment
from app.routers import trip
from app.routers import websocket
from app.routers import fleet
from app.routers import maintenance
from app.routers import geocoding
from app.routers import route
from app.routers import driver
from app.routers import fuel



from app.utils.auth import admin_required

app = FastAPI(title="Fleet Management API")
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
app.include_router(vehicle.router)
app.include_router(dashboard.router)
app.include_router(shipment.router)
app.include_router(trip.router)
app.include_router(websocket.router)
app.include_router(fleet.router)
app.include_router(maintenance.router)
app.include_router(geocoding.router)
app.include_router(route.router)
app.include_router(driver.router)
app.include_router(fuel.router)


@app.get("/")
def home():
    return {
        "message": "Fleet Management API is running"
    }


@app.get("/admin")
def admin_dashboard(user=Depends(admin_required)):
    return {
        "message": "Welcome Admin!",
        "user": user
    }