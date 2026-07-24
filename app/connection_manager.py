from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, trip_id: int, websocket: WebSocket):
        await websocket.accept()
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = []
        self.active_connections[trip_id].append(websocket)

    def disconnect(self, trip_id: int, websocket: WebSocket):
        if trip_id in self.active_connections:
            if websocket in self.active_connections[trip_id]:
                self.active_connections[trip_id].remove(websocket)
            if not self.active_connections[trip_id]:
                del self.active_connections[trip_id]

    def has_connections(self, trip_id: int) -> bool:
        return trip_id in self.active_connections and len(self.active_connections[trip_id]) > 0

    async def broadcast(self, trip_id: int, message: dict):
        if trip_id not in self.active_connections:
            return

        disconnected = []

        for connection in self.active_connections[trip_id]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(trip_id, connection)


manager = ConnectionManager()