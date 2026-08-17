from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

from app.database import SessionLocal
from app.models import Trip, Vehicle
from app.connection_manager import manager
from app.services.route_service import get_route

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/tracking/{trip_id}")
async def websocket_tracking(
    websocket: WebSocket,
    trip_id: int
):

    print(">>> WebSocket endpoint called")

    await manager.connect(websocket)

    print(">>> WebSocket accepted")

    db = SessionLocal()

    try:

        # ==========================================
        # GET TRIP
        # ==========================================

        trip = (
            db.query(Trip)
            .filter(Trip.id == trip_id)
            .first()
        )

        if not trip:

            await websocket.send_json({
                "message": "Trip not found"
            })

            return


        # ==========================================
        # CHECK TRIP COORDINATES
        # ==========================================

        if (
            trip.pickup_latitude is None
            or trip.pickup_longitude is None
            or trip.destination_latitude is None
            or trip.destination_longitude is None
        ):

            await websocket.send_json({
                "message": "Trip coordinates are missing"
            })

            return


        print(
            ">>> Pickup:",
            trip.pickup_latitude,
            trip.pickup_longitude
        )

        print(
            ">>> Destination:",
            trip.destination_latitude,
            trip.destination_longitude
        )


        # ==========================================
        # GENERATE ROAD ROUTE USING OSRM
        # ==========================================

        route = get_route(
            trip.pickup_latitude,
            trip.pickup_longitude,
            trip.destination_latitude,
            trip.destination_longitude
        )


        if not route:

            await websocket.send_json({
                "message": "Route could not be generated"
            })

            return


        route_coordinates = route["route_coordinates"]

        print(
            f">>> Route generated with "
            f"{len(route_coordinates)} points"
        )


        # ==========================================
        # GET VEHICLE
        # ==========================================

        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.vehicle_id == trip.vehicle_id
            )
            .first()
        )


        if not vehicle:

            await websocket.send_json({
                "message": "Vehicle not found"
            })

            return


        # ==========================================
        # START VEHICLE AT PICKUP
        # ==========================================

        vehicle.latitude = trip.pickup_latitude
        vehicle.longitude = trip.pickup_longitude

        db.commit()
        db.refresh(vehicle)


        # ==========================================
        # ROUTE INDEX
        # ==========================================

        route_index = 0


        # ==========================================
        # LIVE TRACKING LOOP
        # ==========================================

        while True:

            # --------------------------------------
            # Check trip still exists
            # --------------------------------------

            trip = (
                db.query(Trip)
                .filter(Trip.id == trip_id)
                .first()
            )

            if not trip:

                await websocket.send_json({
                    "message": "Trip not found"
                })

                break


            # --------------------------------------
            # Move vehicle along actual road route
            # --------------------------------------

            if route_index < len(route_coordinates):

                current_point = route_coordinates[
                    route_index
                ]

                vehicle.latitude = current_point[0]
                vehicle.longitude = current_point[1]

                db.commit()
                db.refresh(vehicle)


                print(
                    f">>> Vehicle {vehicle.vehicle_id} "
                    f"position: "
                    f"{vehicle.latitude}, "
                    f"{vehicle.longitude}"
                )


                # Move several route points every update
                route_index += 3


            else:

                # Vehicle reached destination

                vehicle.latitude = (
                    trip.destination_latitude
                )

                vehicle.longitude = (
                    trip.destination_longitude
                )

                db.commit()
                db.refresh(vehicle)


                print(
                    f">>> Vehicle {vehicle.vehicle_id} "
                    f"reached destination"
                )


            # ======================================
            # SEND LIVE DATA TO FRONTEND
            # ======================================

            data = {

                "trip_id":
                    trip.id,

                "driver_id":
                    trip.driver_id,

                "vehicle_id":
                    vehicle.vehicle_id,

                "pickup_location":
                    trip.pickup_location,

                "destination":
                    trip.destination,

                "pickup_latitude":
                    trip.pickup_latitude,

                "pickup_longitude":
                    trip.pickup_longitude,

                "destination_latitude":
                    trip.destination_latitude,

                "destination_longitude":
                    trip.destination_longitude,

                "trip_status":
                    trip.trip_status,

                "latitude":
                    vehicle.latitude,

                "longitude":
                    vehicle.longitude,

                # IMPORTANT
                # Send actual road route
                "route_coordinates":
                    route_coordinates,

                "distance_km":
                    route["distance_km"],

                "estimated_duration_minutes":
                    route[
                        "estimated_duration_minutes"
                    ]
            }


            await websocket.send_json(data)


            # ======================================
            # WAIT 5 SECONDS
            # ======================================

            await asyncio.sleep(5)


    except WebSocketDisconnect:

        print(
            f">>> WebSocket disconnected "
            f"for trip {trip_id}"
        )


    except Exception as e:

        print(
            f">>> WebSocket error: {e}"
        )


    finally:

        manager.disconnect(websocket)

        db.close()

        print(
            f">>> Tracking stopped "
            f"for trip {trip_id}"
        )