from fastapi import FastAPI
from app.database import Base, engine
from app import models
from app.routers import auth, vehicles, drivers

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FleetFlow Backend")

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)


@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }