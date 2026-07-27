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
        self.ensure_simulation_running()

    async def disconnect(self, websocket: WebSocket, trip_id: int) -> None:
        async with self._lock:
            connections = self._connections_by_trip.get(trip_id, set())
            connections.discard(websocket)
            if not connections:
                self._connections_by_trip.pop(trip_id, None)

    def ensure_simulation_running(self) -> None:
        if self._simulation_task is None or self._simulation_task.done():
            self._simulation_task = asyncio.create_task(self._run_simulation_loop())

    async def _run_simulation_loop(self) -> None:
        while True:
            await asyncio.sleep(2.5)
            try:
                from app.database import SessionLocal
                from app.models.shipment import Shipment
                from app.models.vehicle import Vehicle
                from app.routers.gps import manager as gps_manager

                db = SessionLocal()
                try:
                    shipments = db.query(Shipment).filter(
                        Shipment.status == "in_transit",
                        Shipment.vehicle_id.isnot(None)
                    ).all()

                    for shipment in shipments:
                        v_id = shipment.vehicle_id
                        s_id = shipment.id

                        start_lat = shipment.origin_lat or 13.0827
                        start_lng = shipment.origin_lng or 80.2707
                        dest_lat  = shipment.destination_lat or (start_lat + 0.08)
                        dest_lng  = shipment.destination_lng or (start_lng + 0.08)

                        async with self._lock:
                            pos = self._simulated_positions.get(s_id)
                            if pos is None or pos.get("dest_lat") != dest_lat:
                                pos = {
                                    "latitude": start_lat,
                                    "longitude": start_lng,
                                    "start_lat": start_lat,
                                    "start_lng": start_lng,
                                    "dest_lat": dest_lat,
                                    "dest_lng": dest_lng,
                                    "step": 0,
                                    "max_steps": 40,
                                    "vehicle_id": v_id,
                                    "plate_number": shipment.vehicle.plate_number if shipment.vehicle else f"VEH-{v_id}",
                                }

                            step = (pos["step"] + 1) % pos["max_steps"]
                            t = step / float(pos["max_steps"])
                            new_lat = pos["start_lat"] + (pos["dest_lat"] - pos["start_lat"]) * t
                            new_lng = pos["start_lng"] + (pos["dest_lng"] - pos["start_lng"]) * t

                            pos["latitude"] = new_lat
                            pos["longitude"] = new_lng
                            pos["step"] = step
                            self._simulated_positions[s_id] = pos

                        v = db.query(Vehicle).filter(Vehicle.id == v_id).first()
                        if v:
                            v.latitude = new_lat
                            v.longitude = new_lng
                            db.commit()
                            plate = v.plate_number
                        else:
                            plate = f"VEH-{v_id}"

                        payload = {
                            "type": "location_update",
                            "trip_id": s_id,
                            "shipment_id": s_id,
                            "vehicle_id": v_id,
                            "plate_number": plate,
                            "latitude": round(new_lat, 6),
                            "longitude": round(new_lng, 6),
                            "current_status": "in_transit",
                        }

                        await self.broadcast_trip_update(s_id, payload)
                        await gps_manager.broadcast(payload)
                finally:
                    db.close()
            except Exception:
                pass

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
