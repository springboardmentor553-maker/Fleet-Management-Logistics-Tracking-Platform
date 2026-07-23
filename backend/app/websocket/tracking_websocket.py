import asyncio

from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from app.websocket.connection_manager import manager
from app.services.location_simulator import simulate_vehicle_location

router = APIRouter(
    tags=["Tracking WebSocket"]
)

# ==========================================================
# TRACKING WEBSOCKET
# ==========================================================

@router.websocket("/ws/tracking/{trip_id}")
async def tracking_websocket(
    websocket: WebSocket,
    trip_id: int
):

    await manager.connect(
        trip_id,
        websocket
    )

    print(f"Client connected for Trip {trip_id}")

    simulator = asyncio.create_task(

        simulate_vehicle_location(trip_id)

    )

    try:

        while True:

            message = await websocket.receive_text()

            print(

                f"Trip {trip_id}: {message}"

            )

    except WebSocketDisconnect:

        manager.disconnect(

            trip_id,

            websocket

        )

        simulator.cancel()

        print(

            f"Trip {trip_id} client disconnected"

        )