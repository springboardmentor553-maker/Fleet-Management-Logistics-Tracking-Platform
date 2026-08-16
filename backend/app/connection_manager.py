"""
WebSocket Connection Manager — Task 2
======================================
Manages all active WebSocket clients, grouped by trip_id.

- accept()         : handshake + register a new client
- disconnect()     : remove a client on close/error
- broadcast()      : send a JSON payload to ALL clients watching a trip
- send_personal()  : send to a single client (used for initial state snapshot)
"""

import asyncio
import json
import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # { trip_id: [WebSocket, ...] }
        self._connections: dict[int, list[WebSocket]] = defaultdict(list)
        # lock so concurrent coroutines don't corrupt the list
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------ #
    #  Connection lifecycle                                                #
    # ------------------------------------------------------------------ #

    async def accept(self, websocket: WebSocket, trip_id: int) -> None:
        """Accept the WebSocket handshake and register the client."""
        await websocket.accept()
        async with self._lock:
            self._connections[trip_id].append(websocket)
        logger.info(
            "WS connected  trip_id=%s  total_clients=%s",
            trip_id,
            self.client_count(trip_id),
        )

    async def disconnect(self, websocket: WebSocket, trip_id: int) -> None:
        """Remove a client when its connection closes."""
        async with self._lock:
            clients = self._connections.get(trip_id, [])
            if websocket in clients:
                clients.remove(websocket)
            if not clients:
                self._connections.pop(trip_id, None)
        logger.info(
            "WS disconnected  trip_id=%s  remaining=%s",
            trip_id,
            self.client_count(trip_id),
        )

    # ------------------------------------------------------------------ #
    #  Messaging                                                           #
    # ------------------------------------------------------------------ #

    async def broadcast(self, trip_id: int, payload: dict) -> None:
        """Send a JSON message to every client watching this trip."""
        message = json.dumps(payload)
        async with self._lock:
            clients = list(self._connections.get(trip_id, []))

        dead: list[WebSocket] = []
        for ws in clients:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)

        # Clean up any connections that failed mid-send
        for ws in dead:
            await self.disconnect(ws, trip_id)

    async def send_personal(self, websocket: WebSocket, payload: dict) -> None:
        """Send a JSON message to a single client only."""
        await websocket.send_text(json.dumps(payload))

    # ------------------------------------------------------------------ #
    #  Inspection helpers                                                  #
    # ------------------------------------------------------------------ #

    def client_count(self, trip_id: int) -> int:
        return len(self._connections.get(trip_id, []))

    def active_trips(self) -> list[int]:
        return list(self._connections.keys())


# Singleton — imported everywhere that needs to broadcast
manager = ConnectionManager()
