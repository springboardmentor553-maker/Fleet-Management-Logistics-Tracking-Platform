from fastapi import WebSocket
from typing import Dict, List
import json


class ConnectionManager:
    """
    Manages WebSocket connections for two kinds of channels:
    - Global connections: used for fleet-wide updates (e.g. the Dashboard's
      "Live Vehicle Tracking" map, which shows every vehicle at once).
    - Per-trip connections: used when a client wants updates for a single
      trip only (e.g. a shipment tracking page watching one specific trip).
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.trip_connections: Dict[int, List[WebSocket]] = {}

    # ----- Global (fleet-wide) connections -----

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)

    # ----- Per-trip connections -----

    async def connect_to_trip(self, websocket: WebSocket, trip_id: int):
        await websocket.accept()
        self.trip_connections.setdefault(trip_id, []).append(websocket)

    def disconnect_from_trip(self, websocket: WebSocket, trip_id: int):
        if trip_id in self.trip_connections and websocket in self.trip_connections[trip_id]:
            self.trip_connections[trip_id].remove(websocket)
            if not self.trip_connections[trip_id]:
                del self.trip_connections[trip_id]

    async def broadcast_to_trip(self, trip_id: int, message: dict):
        if trip_id not in self.trip_connections:
            return
        dead_connections = []
        for connection in self.trip_connections[trip_id]:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect_from_trip(dead, trip_id)


manager = ConnectionManager()