import asyncio

from app.websocket.connection_manager import manager


async def simulate_vehicle_location(trip_id: int):
    """
    Simulates a moving vehicle by updating
    latitude and longitude every 5 seconds.
    """

    latitude = 17.3850
    longitude = 78.4867

    while True:

        message = {
            "trip_id": trip_id,
            "latitude": round(latitude, 6),
            "longitude": round(longitude, 6),
            "speed": 60,
            "status": "IN_PROGRESS"
        }

        await manager.broadcast(
            trip_id,
            message
        )

        # Simulate movement
        latitude += 0.0005
        longitude += 0.0005

        await asyncio.sleep(5)