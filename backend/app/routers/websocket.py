from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import random
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Trip, Vehicle
from app.connection_manager import manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/tracking/{trip_id}")
async def websocket_tracking(websocket: WebSocket, trip_id: int):
    print(">>> WebSocket endpoint called")

    await manager.connect(websocket)
    print(">>> WebSocket accepted")

    db = SessionLocal()

    

    try:
        while True:
            trip = db.query(Trip).filter(Trip.id == trip_id).first()

            if not trip:
                await manager.broadcast({
                    "message": "Trip not found"
                })
                break

            vehicle = db.query(Vehicle).filter(
                Vehicle.vehicle_id == trip.vehicle_id
            ).first()

            if vehicle:
                # Simulate live movement
                vehicle.latitude += random.uniform(0.0001, 0.0005)
                vehicle.longitude += random.uniform(0.0001, 0.0005)

                db.commit()
                db.refresh(vehicle)

                await manager.broadcast({
                    "trip_id": trip.id,
                    "driver_id": trip.driver_id,
                    "vehicle_id": vehicle.vehicle_id,
                    "pickup_location": trip.pickup_location,
                    "destination": trip.destination,
                    "trip_status": trip.trip_status,
                    "latitude": vehicle.latitude,
                    "longitude": vehicle.longitude
                })
            else:
                await manager.broadcast({
                    "message": "Vehicle not found"
                })

            await asyncio.sleep(5)

    except Exception as e:
        print(e)
    finally:
        db.close()