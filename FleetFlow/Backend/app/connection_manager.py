import asyncio
import json
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections_by_trip: dict[int, set[WebSocket]] = defaultdict(set)
        self._simulated_positions: dict[int, dict[str, Any]] = {}
        self._lock = asyncio.Lock()
        self._simulation_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket, trip_id: int) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections_by_trip[trip_id].add(websocket)
            if trip_id not in self._simulated_positions:
                # Attempt DB lookup for trip pickup & destination coordinates
                from app.database import SessionLocal
                from app.models.trip import Trip
                db = SessionLocal()
                try:
                    trip = db.query(Trip).filter(Trip.id == trip_id).first()
                    if trip:
                        start_lat = trip.pickup_latitude or 13.0827
                        start_lng = trip.pickup_longitude or 80.2707
                        dest_lat  = trip.destination_latitude or (start_lat + 0.05)
                        dest_lng  = trip.destination_longitude or (start_lng + 0.05)
                        v_id      = trip.vehicle_id
                        plate     = trip.vehicle.plate_number if trip.vehicle else f"TRIP-{trip_id}"
                    else:
                        start_lat, start_lng, dest_lat, dest_lng = 13.0827, 80.2707, 13.1327, 80.3207
                        v_id, plate = trip_id, f"TRIP-{trip_id}"

                    self._simulated_positions[trip_id] = {
                        "latitude": start_lat,
                        "longitude": start_lng,
                        "start_lat": start_lat,
                        "start_lng": start_lng,
                        "dest_lat": dest_lat,
                        "dest_lng": dest_lng,
                        "step": 0,
                        "max_steps": 50,
                        "vehicle_id": v_id,
                        "plate_number": plate,
                    }
                finally:
                    db.close()

        self._start_simulation_loop()

    async def disconnect(self, websocket: WebSocket, trip_id: int) -> None:
        async with self._lock:
            connections = self._connections_by_trip.get(trip_id, set())
            connections.discard(websocket)
            if not connections:
                self._connections_by_trip.pop(trip_id, None)
                self._simulated_positions.pop(trip_id, None)

    def _start_simulation_loop(self) -> None:
        if self._simulation_task is None or self._simulation_task.done():
            self._simulation_task = asyncio.create_task(self._run_simulation_loop())

    async def _run_simulation_loop(self) -> None:
        while True:
            await asyncio.sleep(3)
            async with self._lock:
                trip_ids = list(self._connections_by_trip.keys())

            for trip_id in trip_ids:
                async with self._lock:
                    pos = self._simulated_positions.get(trip_id)
                    if pos is None:
                        continue

                    step = (pos["step"] + 1) % pos["max_steps"]
                    t = step / float(pos["max_steps"])
                    new_lat = pos["start_lat"] + (pos["dest_lat"] - pos["start_lat"]) * t
                    new_lng = pos["start_lng"] + (pos["dest_lng"] - pos["start_lng"]) * t

                    pos["latitude"] = new_lat
                    pos["longitude"] = new_lng
                    pos["step"] = step
                    self._simulated_positions[trip_id] = pos
                    v_id = pos["vehicle_id"]
                    plate = pos["plate_number"]

                # Update Vehicle coordinates in DB as it moves
                if v_id:
                    from app.database import SessionLocal
                    from app.models.vehicle import Vehicle
                    db = SessionLocal()
                    try:
                        v = db.query(Vehicle).filter(Vehicle.id == v_id).first()
                        if v:
                            v.latitude = new_lat
                            v.longitude = new_lng
                            db.commit()
                    finally:
                        db.close()

                await self.broadcast_location_update(
                    trip_id,
                    latitude=new_lat,
                    longitude=new_lng,
                    vehicle_id=v_id,
                    plate_number=plate,
                )

    async def broadcast_trip_update(self, trip_id: int, payload: dict[str, Any]) -> None:
        async with self._lock:
            connections = list(self._connections_by_trip.get(trip_id, set()))

        dead_connections: list[WebSocket] = []
        for websocket in connections:
            try:
                await websocket.send_text(json.dumps(payload))
            except Exception:
                dead_connections.append(websocket)

        if dead_connections:
            for websocket in dead_connections:
                await self.disconnect(websocket, trip_id)

    async def broadcast_status_update(self, trip_id: int, status: str, *, shipment_id: int | None = None) -> None:
        await self.broadcast_trip_update(trip_id, {
            "type": "status_update",
            "trip_id": trip_id,
            "shipment_id": shipment_id,
            "status": status,
        })

    async def broadcast_location_update(
        self,
        trip_id: int,
        *,
        latitude: float,
        longitude: float,
        vehicle_id: int | None = None,
        plate_number: str | None = None,
    ) -> None:
        await self.broadcast_trip_update(trip_id, {
            "type": "location_update",
            "trip_id": trip_id,
            "vehicle_id": vehicle_id,
            "plate_number": plate_number,
            "latitude": latitude,
            "longitude": longitude,
            "current_status": "in_transit",
        })


manager = ConnectionManager()
