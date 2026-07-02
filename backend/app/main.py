from fastapi import FastAPI
from app.config import settings

# Initialize the FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FleetFlow - Fleet Management & Logistics Tracking Platform Backend APIs",
    version="1.0.0"
)

@app.get("/", tags=["Health Check"])
def home():
    """
    Health check endpoint to verify that the FleetFlow backend is running successfully.
    """
    return {
        "message": "FleetFlow Backend Running Successfully"
    }