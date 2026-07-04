from fastapi import FastAPI, Depends

from app.routers import auth
from app.routers import vehicle
from app.utils.auth import admin_required
from app.routers import dashboard

app = FastAPI(title="Fleet Management API")

app.include_router(auth.router)
app.include_router(vehicle.router)
app.include_router(dashboard.router)


@app.get("/")
def home():
    return {"message": "Fleet Management API is running"}


@app.get("/admin")
def admin_dashboard(user=Depends(admin_required)):
    return {
        "message": "Welcome Admin!",
        "user": user
    }