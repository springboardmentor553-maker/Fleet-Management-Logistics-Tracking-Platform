from fastapi import WebSocket


class ConnectionManager:

    def __init__(self):
        # Store active WebSocket connections by trip ID
        self.active_connections = {}

    async def connect(
        self,
        trip_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = []

        self.active_connections[trip_id].append(websocket)

        print(f"Trip {trip_id}: Client connected")
        print(f"Active clients: {len(self.active_connections[trip_id])}")

    def disconnect(
        self,
        trip_id: int,
        websocket: WebSocket
    ):
        if trip_id in self.active_connections:

            if websocket in self.active_connections[trip_id]:
                self.active_connections[trip_id].remove(websocket)

            if len(self.active_connections[trip_id]) == 0:
                del self.active_connections[trip_id]

            print(f"Trip {trip_id}: Client disconnected")

    async def broadcast(
        self,
        trip_id: int,
        message: dict
    ):
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