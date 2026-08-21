import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.trip import Trip
from app.services.connection_manager import ConnectionManager
from app.services.maps import get_route


router = APIRouter(
    prefix="/ws",
    tags=["WebSocket"]
)

manager = ConnectionManager()


@router.websocket("/tracking/{trip_id}")
async def tracking_websocket(
    websocket: WebSocket,
    trip_id: int
):
    await manager.connect(trip_id, websocket)

    db: Session = SessionLocal()

    try:
        # Find the trip
        trip = (
            db.query(Trip)
            .filter(Trip.id == trip_id)
            .first()
        )

        if trip is None:
            await websocket.send_json({
                "error": "Trip not found"
            })
            return

        # -------------------------------------------------
        # Get the planned ORS route
        # -------------------------------------------------
        route_data = get_route(
            trip.pickup_location,
            trip.delivery_location
        )

        route_coordinates = route_data["route_coordinates"]

        # -------------------------------------------------
        # Get the vehicle's CURRENT stored position
        # -------------------------------------------------
        vehicle = trip.vehicle

        current_latitude = vehicle.current_latitude
        current_longitude = vehicle.current_longitude

        # -------------------------------------------------
        # Send route + current vehicle position
        # -------------------------------------------------
        shipment_status = None

        if trip.shipment:
            shipment_status = (
                trip.shipment.current_status
            )

        await websocket.send_json({
            "trip_id": trip_id,
            "type": "route",
            "route": route_coordinates,
            "distance_km": route_data["distance_km"],
            "duration_minutes": route_data["duration_minutes"],
            "eta": route_data["eta"],
            "latitude": current_latitude,
            "longitude": current_longitude,
            "shipment_status": shipment_status,
            "trip_status": trip.trip_status
        })

        # -------------------------------------------------
        # Scheduled / Completed / Cancelled
        # -------------------------------------------------
        if trip.trip_status in (
            "Scheduled",
            "Completed",
            "Cancelled"
        ):

            # Send the current position once.
            await websocket.send_json({
                "trip_id": trip_id,
                "type": "location",
                "latitude": current_latitude,
                "longitude": current_longitude,
                "shipment_status": shipment_status,
                "trip_status": trip.trip_status
            })

            # Keep the connection alive while the user
            # views the map, but DO NOT move the vehicle.
            while True:
                await asyncio.sleep(30)

        # -------------------------------------------------
        # Started / In Progress
        # -------------------------------------------------
        if trip.trip_status in (
            "Started",
            "In Progress"
        ):

            # -------------------------------------------------
            # Find the closest point on the ORS route
            # to the vehicle's current location.
            # -------------------------------------------------
            if (
                current_latitude is not None
                and current_longitude is not None
            ):

                closest_index = min(
                    range(len(route_coordinates)),
                    key=lambda index: (
                        (route_coordinates[index][0] - current_latitude) ** 2
                        +
                        (route_coordinates[index][1] - current_longitude) ** 2
                    )
                )

            else:
                # If there is no stored position,
                # start at the beginning of the route.
                closest_index = 0

                current_latitude = (
                    route_coordinates[0][0]
                )

                current_longitude = (
                    route_coordinates[0][1]
                )

                vehicle.current_latitude = (
                    current_latitude
                )

                vehicle.current_longitude = (
                    current_longitude
                )

                db.commit()

            # -------------------------------------------------
            # Continue from the vehicle's current position.
            # -------------------------------------------------
            for index in range(
                closest_index,
                len(route_coordinates)
            ):

                latitude, longitude = (
                    route_coordinates[index]
                )

                # Refresh trip state from database.
                db.expire_all()

                trip = (
                    db.query(Trip)
                    .filter(Trip.id == trip_id)
                    .first()
                )

                if trip is None:
                    break

                # Stop movement if trip is no longer active.
                if trip.trip_status not in (
                    "Started",
                    "In Progress"
                ):
                    break

                vehicle = trip.vehicle

                # Persist current vehicle location.
                vehicle.current_latitude = latitude
                vehicle.current_longitude = longitude

                shipment_status = None

                if trip.shipment:
                    shipment_status = (
                        trip.shipment.current_status
                    )

                db.commit()

                # Broadcast current vehicle position.
                await manager.broadcast(
                    trip_id,
                    {
                        "trip_id": trip_id,
                        "type": "location",
                        "latitude": round(
                            latitude,
                            6
                        ),
                        "longitude": round(
                            longitude,
                            6
                        ),
                        "shipment_status": shipment_status,
                        "trip_status": trip.trip_status
                    }
                )

                await asyncio.sleep(3)

    except WebSocketDisconnect:

        manager.disconnect(
            trip_id,
            websocket
        )

    except Exception as error:

        print(
            f"Tracking error for trip {trip_id}: {error}"
        )

        try:
            await websocket.send_json({
                "error": str(error)
            })
        except Exception:
            pass

    finally:

        db.close()

        manager.disconnect(
            trip_id,
            websocket
        )