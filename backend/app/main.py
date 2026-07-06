from fastapi import FastAPI

from app.routers import auth, driver, vehicle

app = FastAPI()

app.include_router(auth.router)
app.include_router(driver.router)
app.include_router(vehicle.router)

@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }
