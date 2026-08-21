from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.connection_manager import manager
from app.database import SessionLocal
from app.models.trip import Trip
from app.services.route_service import get_route

import asyncio
import polyline


router = APIRouter(tags=["WebSocket"])


# Track which trips currently have a running simulation
active_simulations = set()


@router.websocket("/ws/tracking/{trip_id}")
async def websocket_tracking(
    websocket: WebSocket,
    trip_id: int
):

    await manager.connect(trip_id, websocket)

    db = SessionLocal()

    try:

        # -------------------------------------------------
        # GET TRIP
        # -------------------------------------------------

        trip = (
            db.query(Trip)
            .filter(Trip.id == trip_id)
            .first()
        )

        if trip is None:

            await websocket.send_json({
                "error": "Trip not found"
            })

            await websocket.close()
            return


        # -------------------------------------------------
        # CHECK COORDINATES
        # -------------------------------------------------

        if (
            trip.current_latitude is None
            or trip.current_longitude is None
            or trip.destination_latitude is None
            or trip.destination_longitude is None
        ):

            await websocket.send_json({
                "error": "Trip coordinates are missing"
            })

            await websocket.close()
            return


        try:

            current_lat = float(
                trip.current_latitude
            )

            current_lon = float(
                trip.current_longitude
            )

            destination_lat = float(
                trip.destination_latitude
            )

            destination_lon = float(
                trip.destination_longitude
            )

        except (TypeError, ValueError):

            await websocket.send_json({
                "error": "Invalid trip coordinates"
            })

            await websocket.close()
            return


        # -------------------------------------------------
        # SEND INITIAL VEHICLE POSITION
        # -------------------------------------------------

        await manager.broadcast(
            trip_id,
            {
                "trip_id": trip_id,
                "latitude": current_lat,
                "longitude": current_lon,
                "status": trip.status or "Created"
            }
        )


        # -------------------------------------------------
        # PREVENT MULTIPLE SIMULATIONS
        # -------------------------------------------------

        if trip_id in active_simulations:

            while True:
                await asyncio.sleep(10)

        active_simulations.add(trip_id)


        # -------------------------------------------------
        # GENERATE ROUTE
        # -------------------------------------------------

        route = get_route(
            current_lat,
            current_lon,
            destination_lat,
            destination_lon
        )

        if route is None:

            await manager.broadcast(
                trip_id,
                {
                    "trip_id": trip_id,
                    "latitude": current_lat,
                    "longitude": current_lon,
                    "status": "Route Unavailable"
                }
            )

            active_simulations.discard(trip_id)
            await websocket.close()
            return


        # -------------------------------------------------
        # DECODE ROUTE
        # -------------------------------------------------

        coordinates = polyline.decode(
            route["polyline"]
        )


        if not coordinates:

            active_simulations.discard(trip_id)

            await websocket.send_json({
                "error": "Route contains no coordinates"
            })

            await websocket.close()
            return


        print(
            f"Trip {trip_id}: Route has "
            f"{len(coordinates)} points"
        )


        # -------------------------------------------------
        # SIMULATE VEHICLE MOVEMENT
        # -------------------------------------------------

        for lat, lon in coordinates:

            # ---------------------------------------------
            # UPDATE DATABASE LOCATION
            # ---------------------------------------------

            trip.current_latitude = str(lat)
            trip.current_longitude = str(lon)

            trip.status = "In Transit"

            db.commit()


            # ---------------------------------------------
            # SEND LIVE LOCATION
            # ---------------------------------------------

            await manager.broadcast(
                trip_id,
                {
                    "trip_id": trip_id,
                    "latitude": lat,
                    "longitude": lon,
                    "status": "In Transit"
                }
            )


            # ---------------------------------------------
            # WAIT BEFORE NEXT LOCATION
            # ---------------------------------------------

            await asyncio.sleep(0.5)


        # -------------------------------------------------
        # ARRIVED AT DESTINATION
        # -------------------------------------------------

        final_lat = coordinates[-1][0]
        final_lon = coordinates[-1][1]


        trip.current_latitude = str(final_lat)
        trip.current_longitude = str(final_lon)

        trip.status = "Delivered"

        db.commit()


        # -------------------------------------------------
        # SEND DELIVERED STATUS
        # -------------------------------------------------

        await manager.broadcast(
            trip_id,
            {
                "trip_id": trip_id,
                "latitude": final_lat,
                "longitude": final_lon,
                "status": "Delivered"
            }
        )


        print(
            f"Trip {trip_id}: Vehicle reached destination"
        )


        # -------------------------------------------------
        # KEEP CONNECTION ALIVE
        # -------------------------------------------------

        while True:

            await asyncio.sleep(10)


    except WebSocketDisconnect:

        print(
            f"WebSocket disconnected for Trip {trip_id}"
        )


    except Exception as e:

        print(
            f"WebSocket error for Trip {trip_id}: {e}"
        )


    finally:

        active_simulations.discard(trip_id)

        manager.disconnect(
            trip_id,
            websocket
        )

        db.close()