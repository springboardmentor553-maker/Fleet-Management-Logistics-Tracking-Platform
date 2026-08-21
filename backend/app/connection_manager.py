from fastapi import WebSocket


class ConnectionManager:

    def __init__(self):

        self.active_connections = {}


    async def connect(
        self,
        trip_id: int,
        websocket: WebSocket
    ):

        await websocket.accept()

        if trip_id not in self.active_connections:

            self.active_connections[trip_id] = []

        self.active_connections[trip_id].append(
            websocket
        )

        print(
            f"Client connected to Trip {trip_id}"
        )


    def disconnect(
        self,
        trip_id: int,
        websocket: WebSocket
    ):

        if trip_id not in self.active_connections:
            return

        if websocket in self.active_connections[trip_id]:

            self.active_connections[trip_id].remove(
                websocket
            )

        if not self.active_connections[trip_id]:

            del self.active_connections[trip_id]

        print(
            f"Client disconnected from Trip {trip_id}"
        )


    async def broadcast(
        self,
        trip_id: int,
        message: dict
    ):

        if trip_id not in self.active_connections:
            return

        disconnected = []

        for connection in list(
            self.active_connections[trip_id]
        ):

            try:

                await connection.send_json(
                    message
                )

            except Exception:

                disconnected.append(
                    connection
                )


        for connection in disconnected:

            self.disconnect(
                trip_id,
                connection
            )


manager = ConnectionManager()