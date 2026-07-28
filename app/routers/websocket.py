from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

from app.websocket.connection_manager import manager
from app.services.location_simulator import simulate_vehicle_location

router = APIRouter(
    tags=["WebSocket"]
)


@router.websocket("/websocket/tracking/{trip_id}")
async def websocket_tracking(
    websocket: WebSocket,
    trip_id: int
):
    await manager.connect(
        trip_id,
        websocket
    )

    # Start location simulation
    simulator_task = asyncio.create_task(
        simulate_vehicle_location(trip_id)
    )

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(
            trip_id,
            websocket
        )
        simulator_task.cancel()