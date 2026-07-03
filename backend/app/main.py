from fastapi import FastAPI
from app.database import Base, engine
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }