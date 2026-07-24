import asyncio
import random

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.connection_manager import manager

router = APIRouter(
    tags=["Live Tracking"]
)

simulation_tasks: dict[int, asyncio.Task] = {}


@router.websocket("/ws/tracking/{trip_id}")
async def tracking_socket(websocket: WebSocket, trip_id: int):
    await manager.connect(trip_id, websocket)

    if trip_id not in simulation_tasks:
        simulation_tasks[trip_id] = asyncio.create_task(
            simulate_vehicle_location(trip_id)
        )

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(trip_id, websocket)

        if not manager.has_connections(trip_id):
            task = simulation_tasks.pop(trip_id, None)
            if task:
                task.cancel()


async def simulate_vehicle_location(trip_id: int):
    latitude = 13.0827
    longitude = 80.2707

    try:
        while True:
            await asyncio.sleep(3)

            latitude += random.uniform(-0.01, 0.01)
            longitude += random.uniform(-0.01, 0.01)

            await manager.broadcast(
                trip_id,
                {
                    "type": "vehicle_location",
                    "trip_id": trip_id,
                    "latitude": round(latitude, 6),
                    "longitude": round(longitude, 6),
                }
            )
    except asyncio.CancelledError:
        pass