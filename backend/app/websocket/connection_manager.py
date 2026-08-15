import asyncio
from typing import Dict, List, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps tracking_number to a list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Tasks for simulations
        self.simulation_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, tracking_number: str, websocket: WebSocket):
        await websocket.accept()
        if tracking_number not in self.active_connections:
            self.active_connections[tracking_number] = []
        self.active_connections[tracking_number].append(websocket)

    def disconnect(self, tracking_number: str, websocket: WebSocket):
        if tracking_number in self.active_connections:
            self.active_connections[tracking_number].remove(websocket)
            if not self.active_connections[tracking_number]:
                del self.active_connections[tracking_number]

    async def broadcast_to_room(self, tracking_number: str, message: Any):
        if tracking_number in self.active_connections:
            for connection in self.active_connections[tracking_number]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Clean up broken connections
                    pass

manager = ConnectionManager()
