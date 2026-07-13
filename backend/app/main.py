from fastapi import FastAPI
from app.database import Base, engine
from fastapi.staticfiles import StaticFiles
import os
from app import models
from app.routers import auth, vehicles, drivers, shipments
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
from app.websocket_manager import manager

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FleetFlow Backend")
os.makedirs("uploads/profile_photos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(shipments.router)


@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }

@app.websocket("/ws/tracking")
async def websocket_tracking(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keeps connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)