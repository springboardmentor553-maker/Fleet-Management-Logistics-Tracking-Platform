import asyncio
import random

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.trip import Trip
from app.services.connection_manager import ConnectionManager


router = APIRouter(
    prefix="/ws",
    tags=["WebSocket"]
)

manager = ConnectionManager()


@router.websocket("/tracking/{trip_id}")
async def tracking_websocket(
    websocket: WebSocket,
    trip_id: int
):
    await manager.connect(trip_id, websocket)

    latitude = 12.9352
    longitude = 77.6245

    try:
        while True:

            db: Session = SessionLocal()

            trip = (
                db.query(Trip)
                .filter(Trip.id == trip_id)
                .first()
            )

            shipment_status = None

            if trip and trip.shipment:
                shipment_status = trip.shipment.current_status

            db.close()

            latitude += random.uniform(-0.0005, 0.0005)
            longitude += random.uniform(-0.0005, 0.0005)

            await manager.broadcast(
                trip_id,
                {
                    "trip_id": trip_id,
                    "latitude": round(latitude, 6),
                    "longitude": round(longitude, 6),
                    "shipment_status": shipment_status
                }
            )

            await asyncio.sleep(3)

    except WebSocketDisconnect:
        manager.disconnect(trip_id, websocket)
        print(f"Client disconnected from trip {trip_id}")