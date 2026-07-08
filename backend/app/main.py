from fastapi import FastAPI
from backend.app.role_checker import role_required

from backend.app.routers.auth import router as auth_router
from fastapi import Depends
from backend.app.dependencies import get_current_user

app = FastAPI(title="FleetFlow API")


app.include_router(auth_router)


@app.get("/")
def home():
    return {"message": "Welcome to FleetFlow"}
@app.get("/profile")
def profile(current_user=Depends(get_current_user)):
    return {
        "message": "Protected Route",
        "user": current_user
    }
@app.get("/admin")
def admin_dashboard(
    current_user=Depends(role_required(["Admin"]))
):
    return {
        "message": "Welcome Admin",
        "user": current_user
    }