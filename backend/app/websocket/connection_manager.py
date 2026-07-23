from collections import defaultdict
from typing import Dict, List

from fastapi import WebSocket


class ConnectionManager:
    """
    Manages all active WebSocket connections.
    """

    def __init__(self):

        self.active_connections: Dict[int, List[WebSocket]] = defaultdict(list)

    # ==========================================================
    # CONNECT
    # ==========================================================

    async def connect(
        self,
        trip_id: int,
        websocket: WebSocket,
    ):

        await websocket.accept()

        self.active_connections[trip_id].append(websocket)

        print(f"✅ Client connected to Trip {trip_id}")

        print(f"Active Clients: {len(self.active_connections[trip_id])}")

    # ==========================================================
    # DISCONNECT
    # ==========================================================

    def disconnect(
        self,
        trip_id: int,
        websocket: WebSocket,
    ):

        if trip_id in self.active_connections:

            if websocket in self.active_connections[trip_id]:

                self.active_connections[trip_id].remove(websocket)

                print(f"❌ Client disconnected from Trip {trip_id}")

                if len(self.active_connections[trip_id]) == 0:

                    del self.active_connections[trip_id]

    # ==========================================================
    # SEND TO ONE CLIENT
    # ==========================================================

    async def send_personal_message(
        self,
        websocket: WebSocket,
        message: dict,
    ):

        await websocket.send_json(message)

    # ==========================================================
    # BROADCAST TO ONE TRIP
    # ==========================================================

    async def broadcast_trip(
        self,
        trip_id: int,
        message: dict,
    ):

        if trip_id not in self.active_connections:

            return

        disconnected = []

        for websocket in self.active_connections[trip_id]:

            try:

                await websocket.send_json(message)

            except Exception:

                disconnected.append(websocket)

        for websocket in disconnected:

            self.disconnect(
                trip_id,
                websocket
            )

    # ==========================================================
    # BROADCAST TO ALL CLIENTS
    # ==========================================================

    async def broadcast_all(
        self,
        message: dict,
    ):

        for trip_id in list(self.active_connections.keys()):

            await self.broadcast_trip(
                trip_id,
                message
            )

    # ==========================================================
    # BROADCAST JSON
    # ==========================================================

    async def broadcast_json(
        self,
        message: dict,
    ):

        disconnected = []

        for trip_id, clients in self.active_connections.items():

            for websocket in clients:

                try:

                    await websocket.send_json(message)

                except Exception:

                    disconnected.append((trip_id, websocket))

        for trip_id, websocket in disconnected:

            self.disconnect(
                trip_id,
                websocket
            )

    # ==========================================================
    # TOTAL CONNECTIONS
    # ==========================================================

    def total_connections(self):

        return sum(

            len(clients)

            for clients in self.active_connections.values()

        )


# ==========================================================
# GLOBAL MANAGER
# ==========================================================

manager = ConnectionManager()