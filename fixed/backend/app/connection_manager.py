import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections, grouped by trip_id, so
    updates for one trip only broadcast to clients watching that trip."""

    def __init__(self):
        # trip_id -> set of active WebSocket connections
        self.active_connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, trip_id: int, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection and start tracking it."""
        await websocket.accept()
        self.active_connections[trip_id].add(websocket)

    def disconnect(self, trip_id: int, websocket: WebSocket) -> None:
        """Remove a disconnected client from the active set."""
        connections = self.active_connections.get(trip_id)
        if connections is not None:
            connections.discard(websocket)
            if not connections:
                del self.active_connections[trip_id]

    async def broadcast(self, trip_id: int, message: dict) -> None:
        """Send a JSON message to every client currently connected to
        this trip. Any connection that fails to receive it (e.g. it
        dropped without a clean close) is removed."""
        connections = self.active_connections.get(trip_id)
        if not connections:
            return

        payload = json.dumps(message)
        dead_connections = []
        for connection in connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.append(connection)

        for connection in dead_connections:
            connections.discard(connection)

    def active_count(self, trip_id: int) -> int:
        return len(self.active_connections.get(trip_id, ()))


# Single shared instance used across the app (imported by the WebSocket
# router and by anything that needs to broadcast, e.g. shipment status updates)
manager = ConnectionManager()
