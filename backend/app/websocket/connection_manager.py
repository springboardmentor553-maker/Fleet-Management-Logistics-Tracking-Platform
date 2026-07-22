"""
Connection Manager — app/websocket/connection_manager.py

Manages all active WebSocket connections grouped by trip_id.
Also owns the per-trip simulation asyncio Tasks.

Thread-safe within a single asyncio event loop (FastAPI's default).
"""
import asyncio
import logging
from typing import Dict, Set

from fastapi import WebSocket

logger = logging.getLogger("fleetflow.websocket.connection_manager")


class ConnectionManager:
    """
    Maintains active WebSocket connections indexed by trip_id.

    Attributes
    ----------
    _connections : Dict[int, Set[WebSocket]]
        Maps trip_id → set of active WebSocket connections.
    _simulation_tasks : Dict[int, asyncio.Task]
        Maps trip_id → running simulation Task (one per trip).
    """

    def __init__(self) -> None:
        self._connections: Dict[int, Set[WebSocket]] = {}
        self._simulation_tasks: Dict[int, asyncio.Task] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def connect(self, trip_id: int, websocket: WebSocket) -> None:
        """Accept a WebSocket connection and register it under trip_id."""
        await websocket.accept()
        if trip_id not in self._connections:
            self._connections[trip_id] = set()
        self._connections[trip_id].add(websocket)
        logger.info(
            "ws.connect  — trip=%d  total_clients=%d",
            trip_id,
            len(self._connections[trip_id]),
        )

    def register_simulation(self, trip_id: int, task: asyncio.Task) -> None:
        """Store the simulation task so we can cancel it later."""
        self._simulation_tasks[trip_id] = task

    async def disconnect(self, trip_id: int, websocket: WebSocket) -> None:
        """Remove a WebSocket from the pool; cancel simulation if last client."""
        trip_clients = self._connections.get(trip_id, set())
        trip_clients.discard(websocket)

        remaining = len(trip_clients)
        logger.info(
            "ws.disconnect — trip=%d  remaining_clients=%d",
            trip_id,
            remaining,
        )

        # Clean up empty sets
        if remaining == 0 and trip_id in self._connections:
            del self._connections[trip_id]
            self._cancel_simulation(trip_id)

    async def broadcast_to_trip(self, trip_id: int, message: dict) -> None:
        """
        Send a JSON message to every client watching trip_id.

        Silently removes any connections that have already closed.
        """
        clients = set(self._connections.get(trip_id, set()))  # snapshot
        if not clients:
            return

        dead: list[WebSocket] = []
        for ws in clients:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)

        # Remove dead connections without crashing the broadcast
        for ws in dead:
            self._connections.get(trip_id, set()).discard(ws)

    def get_connection_count(self, trip_id: int) -> int:
        """Return the number of clients currently watching trip_id."""
        return len(self._connections.get(trip_id, set()))

    def has_running_simulation(self, trip_id: int) -> bool:
        """True if a simulation task is already running for trip_id."""
        task = self._simulation_tasks.get(trip_id)
        return task is not None and not task.done()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _cancel_simulation(self, trip_id: int) -> None:
        """Cancel and clean up the simulation task for trip_id."""
        task = self._simulation_tasks.pop(trip_id, None)
        if task and not task.done():
            task.cancel()
            logger.info(
                "ws.simulation — trip=%d  simulation cancelled (no clients left)",
                trip_id,
            )


# Singleton — imported by both the router and the shipment router
manager = ConnectionManager()
