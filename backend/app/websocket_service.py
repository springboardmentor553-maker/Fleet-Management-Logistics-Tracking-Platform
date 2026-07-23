import asyncio

from app.websocket.connection_manager import manager


def broadcast_message(message: dict):
    """
    Broadcast message to all connected WebSocket clients.
    Safe to call from synchronous FastAPI routes.
    """

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast_json(message))

    except RuntimeError:
        # No running event loop (e.g. during startup)
        asyncio.run(manager.broadcast_json(message))