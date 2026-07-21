import asyncio
import json
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections_by_trip: dict[int, set[WebSocket]] = defaultdict(set)
        self._simulated_positions: dict[int, dict[str, float]] = {}
        self._lock = asyncio.Lock()
        self._simulation_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket, trip_id: int) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections_by_trip[trip_id].add(websocket)
            self._simulated_positions.setdefault(trip_id, {"latitude": 12.9716, "longitude": 77.5946})
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
            await asyncio.sleep(4)
            async with self._lock:
                trip_ids = list(self._connections_by_trip.keys())

            for trip_id in trip_ids:
                async with self._lock:
                    position = self._simulated_positions.get(trip_id)
                    if position is None:
                        continue
                    position = {
                        "latitude": position["latitude"] + 0.002,
                        "longitude": position["longitude"] + 0.002,
                    }
                    self._simulated_positions[trip_id] = position

                await self.broadcast_location_update(trip_id, **position)

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

    async def broadcast_location_update(self, trip_id: int, *, latitude: float, longitude: float) -> None:
        await self.broadcast_trip_update(trip_id, {
            "type": "location_update",
            "trip_id": trip_id,
            "latitude": latitude,
            "longitude": longitude,
        })


manager = ConnectionManager()
