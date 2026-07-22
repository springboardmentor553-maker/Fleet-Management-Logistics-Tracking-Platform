import asyncio
from fastapi import FastAPI
from app.database import Base, engine
from fastapi.staticfiles import StaticFiles
import os
from app import models
from app.routers import auth, vehicles, drivers, shipments, trips, users, company
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
from app.connection_manager import manager
from app.simulation import simulate_vehicle_movement

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
app.include_router(trips.router)
app.include_router(users.router)
app.include_router(company.router)


@app.on_event("startup")
async def start_background_tasks():
    # Runs forever in the background, moving 'ongoing' trips' vehicles
    # a little closer to their destination every few seconds
    asyncio.create_task(simulate_vehicle_movement())


@app.get("/")
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }

@app.websocket("/ws/tracking")
async def websocket_tracking(websocket: WebSocket):
    """Global channel — used by the Dashboard's fleet-wide Live Vehicle Tracking map."""
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keeps connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/ws/tracking/{trip_id}")
async def websocket_trip_tracking(websocket: WebSocket, trip_id: int):
    """Per-trip channel — used to watch a single trip's live location and status."""
    await manager.connect_to_trip(websocket, trip_id)
    try:
        while True:
            await websocket.receive_text()  # keeps connection alive
    except WebSocketDisconnect:
        manager.disconnect_from_trip(websocket, trip_id)