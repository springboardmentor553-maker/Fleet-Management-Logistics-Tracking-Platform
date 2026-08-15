from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.trip import Trip, TripStatus
from app.models.shipment import Shipment, ShipmentStatus
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.fleet import TripCreate, TripUpdate
from fastapi import HTTPException, status, BackgroundTasks

class TripService:
    def __init__(self, db: Session):
        self.db = db

    def create_trip(self, trip_data: TripCreate) -> Trip:
        """
        Create a new Trip after performing required validations:
        - Shipment, Driver, and Vehicle must exist.
        - Shipment must not already be assigned to a Trip.
        - Driver must not have another active trip (CREATED or IN_TRANSIT).
        - Vehicle must not have another active trip (CREATED or IN_TRANSIT).
        """
        # 1. Validate Shipment exists
        shipment = self.db.query(Shipment).filter(Shipment.id == trip_data.shipment_id).first()
        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shipment with ID {trip_data.shipment_id} not found."
            )

        # 2. Validate Driver exists and is available
        driver = self.db.query(Driver).filter(Driver.id == trip_data.driver_id).first()
        if not driver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Driver with ID {trip_data.driver_id} not found."
            )
        from app.models.driver import DriverStatus
        if driver.status in [DriverStatus.OFF_DUTY, DriverStatus.INACTIVE]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver with ID {trip_data.driver_id} is not available."
            )

        # 3. Validate Vehicle exists and is active
        vehicle = self.db.query(Vehicle).filter(Vehicle.id == trip_data.vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {trip_data.vehicle_id} not found."
            )
        from app.models.vehicle import VehicleStatus
        if vehicle.status != VehicleStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle with ID {trip_data.vehicle_id} is not currently active."
            )

        # 4. Prevent duplicate shipment assignments (Shipment -> One Trip)
        existing_shipment_trip = self.db.query(Trip).filter(Trip.shipment_id == trip_data.shipment_id).first()
        if existing_shipment_trip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Shipment with ID {trip_data.shipment_id} is already assigned to trip ID {existing_shipment_trip.id}."
            )

        # 5. A driver cannot have two active trips
        active_driver_trip = self.db.query(Trip).filter(
            Trip.driver_id == trip_data.driver_id,
            Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])
        ).first()
        if active_driver_trip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver with ID {trip_data.driver_id} already has an active trip (ID {active_driver_trip.id})."
            )

        # 6. A vehicle cannot have two active trips
        active_vehicle_trip = self.db.query(Trip).filter(
            Trip.vehicle_id == trip_data.vehicle_id,
            Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])
        ).first()
        if active_vehicle_trip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle with ID {trip_data.vehicle_id} already has an active trip (ID {active_vehicle_trip.id})."
            )

        # Geocode pickup and destination locations
        from app.services.geocoding_service import GeocodingService
        from app.services.route_service import RouteService

        pickup_lat, pickup_lng = GeocodingService.geocode(trip_data.pickup_location)
        dest_lat, dest_lng = GeocodingService.geocode(trip_data.destination)

        # Retrieve route calculation metrics
        route_info = RouteService.get_route(pickup_lat, pickup_lng, dest_lat, dest_lng)

        db_trip = Trip(
            shipment_id=trip_data.shipment_id,
            driver_id=trip_data.driver_id,
            vehicle_id=trip_data.vehicle_id,
            pickup_location=trip_data.pickup_location,
            destination=trip_data.destination,
            scheduled_start_time=trip_data.scheduled_start_time,
            scheduled_end_time=trip_data.scheduled_end_time,
            pickup_latitude=pickup_lat,
            pickup_longitude=pickup_lng,
            destination_latitude=dest_lat,
            destination_longitude=dest_lng,
            distance_km=route_info["distance_km"],
            estimated_duration=route_info["estimated_duration"],
            route_summary=route_info["route_summary"],
            route_geometry=route_info["route_geometry"],
            trip_status=TripStatus.CREATED
        )

        self.db.add(db_trip)
        
        # Update Driver status to ON_TRIP
        driver.status = DriverStatus.ON_TRIP

        from sqlalchemy.exc import IntegrityError
        try:
            self.db.commit()
            self.db.refresh(db_trip)
        except IntegrityError as e:
            self.db.rollback()
            if "trips_shipment_id_key" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Shipment with ID {trip_data.shipment_id} is already assigned to a trip."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A database constraint was violated while saving the trip."
            )
        return db_trip

    def get_all(self) -> list[Trip]:
        """Get all trips."""
        return self.db.query(Trip).order_by(Trip.created_at.desc()).all()

    def get_by_id(self, trip_id: int) -> Trip:
        """Retrieve trip by ID, raising 404 if not found."""
        trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trip with ID {trip_id} not found."
            )
        return trip

    def update_trip(self, trip_id: int, trip_data: TripUpdate, background_tasks: BackgroundTasks = None) -> Trip:
        """
        Update trip details and perform checks if driver, vehicle, or status is modified.
        """
        trip = self.get_by_id(trip_id)
        update_dict = trip_data.model_dump(exclude_unset=True)

        # Geocode and generate new route if location values are being updated
        from app.services.geocoding_service import GeocodingService
        from app.services.route_service import RouteService

        loc_changed = False
        plat = update_dict.get("pickup_latitude", trip.pickup_latitude)
        plng = update_dict.get("pickup_longitude", trip.pickup_longitude)
        dlat = update_dict.get("destination_latitude", trip.destination_latitude)
        dlng = update_dict.get("destination_longitude", trip.destination_longitude)

        if "pickup_location" in update_dict and update_dict["pickup_location"] != trip.pickup_location:
            plat, plng = GeocodingService.geocode(update_dict["pickup_location"])
            update_dict["pickup_latitude"] = plat
            update_dict["pickup_longitude"] = plng
            loc_changed = True
        if "destination" in update_dict and update_dict["destination"] != trip.destination:
            dlat, dlng = GeocodingService.geocode(update_dict["destination"])
            update_dict["destination_latitude"] = dlat
            update_dict["destination_longitude"] = dlng
            loc_changed = True

        if loc_changed:
            route_info = RouteService.get_route(plat, plng, dlat, dlng)
            update_dict["distance_km"] = route_info["distance_km"]
            update_dict["estimated_duration"] = route_info["estimated_duration"]
            update_dict["route_summary"] = route_info["route_summary"]
            update_dict["route_geometry"] = route_info["route_geometry"]

        new_driver_id = update_dict.get("driver_id", trip.driver_id)
        new_vehicle_id = update_dict.get("vehicle_id", trip.vehicle_id)
        new_status = update_dict.get("trip_status", trip.trip_status)

        # If driver changed, validate driver exists
        if "driver_id" in update_dict and update_dict["driver_id"] != trip.driver_id:
            driver = self.db.query(Driver).filter(Driver.id == new_driver_id).first()
            if not driver:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Driver with ID {new_driver_id} not found."
                )
            from app.models.driver import DriverStatus
            if driver.status in [DriverStatus.OFF_DUTY, DriverStatus.INACTIVE]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Driver with ID {new_driver_id} is not available."
                )

        # If vehicle changed, validate vehicle exists
        if "vehicle_id" in update_dict and update_dict["vehicle_id"] != trip.vehicle_id:
            vehicle = self.db.query(Vehicle).filter(Vehicle.id == new_vehicle_id).first()
            if not vehicle:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Vehicle with ID {new_vehicle_id} not found."
                )
            from app.models.vehicle import VehicleStatus
            if vehicle.status != VehicleStatus.ACTIVE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Vehicle with ID {new_vehicle_id} is not currently active."
                )

        # Check for active trip conflicts if updating to active status or changing driver/vehicle on an active trip
        is_active_now = new_status in [TripStatus.CREATED, TripStatus.IN_TRANSIT]
        
        if is_active_now:
            # 1. Check Driver active trips (excluding this trip itself)
            active_driver_trip = self.db.query(Trip).filter(
                Trip.driver_id == new_driver_id,
                Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT]),
                Trip.id != trip.id
            ).first()
            if active_driver_trip:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Driver with ID {new_driver_id} already has an active trip (ID {active_driver_trip.id})."
                )

            # 2. Check Vehicle active trips (excluding this trip itself)
            active_vehicle_trip = self.db.query(Trip).filter(
                Trip.vehicle_id == new_vehicle_id,
                Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT]),
                Trip.id != trip.id
            ).first()
            if active_vehicle_trip:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Vehicle with ID {new_vehicle_id} already has an active trip (ID {active_vehicle_trip.id})."
                )

        # Store old driver id to potentially free them up
        old_driver_id = trip.driver_id

        # Apply updates
        for key, value in update_dict.items():
            setattr(trip, key, value)

        # Sync with Shipment if status changed
        if "trip_status" in update_dict and trip.shipment:
            if update_dict["trip_status"] == TripStatus.IN_TRANSIT:
                trip.shipment.current_status = ShipmentStatus.IN_TRANSIT
                # Start simulation task if explicitly enabled in environment
                import os
                enable_simulator = os.getenv("ENABLE_SIMULATOR", "true").lower() == "true"
                if enable_simulator:
                    from app.websocket.simulator import start_simulation_background
                    if background_tasks:
                        background_tasks.add_task(start_simulation_background, trip.shipment.tracking_number)
            elif update_dict["trip_status"] == TripStatus.COMPLETED:
                trip.shipment.current_status = ShipmentStatus.DELIVERED
                # Snap the final location to the destination
                if trip.destination_latitude is not None and trip.destination_longitude is not None:
                    trip.current_latitude = trip.destination_latitude
                    trip.current_longitude = trip.destination_longitude
                    from datetime import datetime, timezone
                    trip.location_updated_at = datetime.now(timezone.utc)
            elif update_dict["trip_status"] == TripStatus.CANCELLED:
                trip.shipment.current_status = ShipmentStatus.CANCELLED

        # Sync with DriverAssignment
        from app.models.driver_assignment import DriverAssignment, AssignmentStatus
        
        # Check if driver or vehicle is being assigned now, or if it already has one
        current_driver_id = update_dict.get("driver_id", trip.driver_id)
        current_vehicle_id = update_dict.get("vehicle_id", trip.vehicle_id)
        
        if current_driver_id and current_vehicle_id:
            # Check if there is an existing assignment
            existing_assignment = self.db.query(DriverAssignment).filter(DriverAssignment.trip_id == trip.id).first()
            if not existing_assignment:
                new_assignment = DriverAssignment(
                    driver_id=current_driver_id,
                    vehicle_id=current_vehicle_id,
                    trip_id=trip.id,
                    assignment_status=AssignmentStatus.ASSIGNED
                )
                self.db.add(new_assignment)
                existing_assignment = new_assignment
            else:
                # Update existing assignment's driver/vehicle if they changed
                if existing_assignment.driver_id != current_driver_id:
                    existing_assignment.driver_id = current_driver_id
                if existing_assignment.vehicle_id != current_vehicle_id:
                    existing_assignment.vehicle_id = current_vehicle_id
            
            # Update assignment status if trip status changed
            if "trip_status" in update_dict:
                if update_dict["trip_status"] == TripStatus.IN_TRANSIT:
                    existing_assignment.assignment_status = AssignmentStatus.ACTIVE
                elif update_dict["trip_status"] == TripStatus.COMPLETED:
                    existing_assignment.assignment_status = AssignmentStatus.COMPLETED
                elif update_dict["trip_status"] == TripStatus.CANCELLED:
                    existing_assignment.assignment_status = AssignmentStatus.CANCELLED

        # Update driver statuses
        from app.models.driver import DriverStatus
        
        if trip.driver_id:
            current_driver = self.db.query(Driver).filter(Driver.id == trip.driver_id).first()
            if current_driver:
                if trip.trip_status in [TripStatus.CREATED, TripStatus.IN_TRANSIT]:
                    current_driver.status = DriverStatus.ON_TRIP
                elif trip.trip_status in [TripStatus.COMPLETED, TripStatus.CANCELLED]:
                    if current_driver.status != DriverStatus.OFF_DUTY:
                        current_driver.status = DriverStatus.AVAILABLE
                        
        if "driver_id" in update_dict and update_dict["driver_id"] != old_driver_id:
            if old_driver_id:
                old_driver = self.db.query(Driver).filter(Driver.id == old_driver_id).first()
                if old_driver and old_driver.status != DriverStatus.OFF_DUTY:
                    old_driver.status = DriverStatus.AVAILABLE

        self.db.commit()
        self.db.refresh(trip)
        return trip

    def delete_trip(self, trip_id: int) -> None:
        """Delete a trip."""
        trip = self.get_by_id(trip_id)
        self.db.delete(trip)
        self.db.commit()
