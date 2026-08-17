from fastapi import WebSocket


class ConnectionManager:

    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()

        if websocket not in self.active_connections:
            self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data):

        disconnected = []

        for connection in self.active_connections:

            try:
                await connection.send_json(data)

            except Exception as e:
                print("WebSocket disconnected:", e)
                disconnected.append(connection)

        # Remove dead connections
        for connection in disconnected:

            if connection in self.active_connections:
                self.active_connections.remove(connection)


manager = ConnectionManager()