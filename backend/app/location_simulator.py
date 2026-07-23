import asyncio

from app.websocket.connection_manager import manager


async def simulate_vehicle_location(trip_id: int):
    """
    Simulate a vehicle travelling towards the pickup location.
    """

    # ----------------------------------------------------------
    # Pickup Location
    # ----------------------------------------------------------

    pickup_latitude = 18.520400
    pickup_longitude = 73.856700

    # ----------------------------------------------------------
    # Vehicle starts about 500m away
    # ----------------------------------------------------------

    latitude = pickup_latitude - 0.010000
    longitude = pickup_longitude - 0.010000

    total_steps = 20

    lat_step = (pickup_latitude - latitude) / total_steps
    lon_step = (pickup_longitude - longitude) / total_steps

    # ----------------------------------------------------------
    # Move towards pickup
    # ----------------------------------------------------------

    for _ in range(total_steps):

        latitude += lat_step
        longitude += lon_step

        await manager.broadcast_trip(
            trip_id,
            {
                "type": "location_update",
                "trip_id": trip_id,
                "latitude": round(latitude, 6),
                "longitude": round(longitude, 6),
                "status": "Coming to Pickup"
            }
        )

        print(
            f"Trip {trip_id} -> "
            f"{latitude:.6f}, {longitude:.6f}"
        )

        await asyncio.sleep(2)

    # ----------------------------------------------------------
    # Vehicle reached pickup
    # ----------------------------------------------------------

    await manager.broadcast_trip(
        trip_id,
        {
            "type": "location_update",
            "trip_id": trip_id,
            "latitude": pickup_latitude,
            "longitude": pickup_longitude,
            "status": "Arrived at Pickup"
        }
    )

    print(f"Trip {trip_id} arrived at pickup.")

    # ----------------------------------------------------------
    # Stay at pickup
    # ----------------------------------------------------------

    while True:

        await asyncio.sleep(5)

        await manager.broadcast_trip(
            trip_id,
            {
                "type": "location_update",
                "trip_id": trip_id,
                "latitude": pickup_latitude,
                "longitude": pickup_longitude,
                "status": "Waiting for Pickup"
            }
        )