import asyncio

from fastapi.testclient import TestClient

from app.main import app
from app.connection_manager import manager


def test_trip_tracking_websocket_broadcasts_updates():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/tracking/42") as websocket:
            connected = websocket.receive_json()
            assert connected["type"] == "connected"
            assert connected["trip_id"] == 42

            asyncio.run(manager.broadcast_trip_update(42, {
                "type": "status_update",
                "status": "in_transit",
            }))

            payload = websocket.receive_json()
            assert payload["type"] == "status_update"
            assert payload["status"] == "in_transit"
