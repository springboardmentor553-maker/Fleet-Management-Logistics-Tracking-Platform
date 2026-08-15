from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.shipment import Shipment, ShipmentStatus
from app.schemas.fleet import ShipmentCreate, ShipmentUpdate
from fastapi import HTTPException, status, BackgroundTasks

class ShipmentService:
    def __init__(self, db: Session):
        self.db = db

    def generate_tracking_number(self) -> str:
        """
        Generate a unique tracking number in the format FLTXXXXXX (e.g. FLT100001).
        Uses a database max value check for robustness.
        """
        # Find the highest tracking number starting with FLT
        max_tracking = self.db.query(func.max(Shipment.tracking_number)).filter(
            Shipment.tracking_number.like("FLT%")
        ).scalar()
        
        if not max_tracking:
            next_num = 100001
        else:
            try:
                # Remove the 'FLT' prefix and convert to int
                current_num = int(max_tracking[3:])
                next_num = current_num + 1
            except ValueError:
                next_num = 100001
        
        return f"FLT{next_num:06d}"

    def create_shipment(self, shipment_data: ShipmentCreate) -> Shipment:
        """
        Create a new shipment. Generates a unique tracking_number automatically.
        Resolves backward compatibility fields (origin, destination, driver_id, vehicle_id).
        """
        # Resolve compatible fields
        pickup_loc = shipment_data.pickup_location or shipment_data.origin
        delivery_loc = shipment_data.delivery_location or shipment_data.destination
        driver_id = shipment_data.assigned_driver_id or shipment_data.driver_id
        vehicle_id = shipment_data.assigned_vehicle_id or shipment_data.vehicle_id

        # Basic validations
        if not pickup_loc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pickup location (or origin) is required."
            )
        if not delivery_loc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delivery location (or destination) is required."
            )

        tracking_num = self.generate_tracking_number()
        
        db_shipment = Shipment(
            tracking_number=tracking_num,
            sender_name=shipment_data.sender_name,
            receiver_name=shipment_data.receiver_name,
            pickup_location=pickup_loc,
            delivery_location=delivery_loc,
            current_status=ShipmentStatus.CREATED,
            weight=shipment_data.weight,
            assigned_driver_id=driver_id,
            assigned_vehicle_id=vehicle_id
        )
        
        self.db.add(db_shipment)
        self.db.commit()
        self.db.refresh(db_shipment)
        return db_shipment

    def get_all(self) -> list[Shipment]:
        """
        Get all shipments ordered by created_at descending.
        """
        return self.db.query(Shipment).order_by(Shipment.created_at.desc()).all()

    def get_by_driver(self, driver_id: int) -> list[Shipment]:
        """
        Get shipments assigned to a specific driver.
        """
        return self.db.query(Shipment).filter(
            Shipment.assigned_driver_id == driver_id
        ).order_by(Shipment.created_at.desc()).all()

    def get_by_id(self, shipment_id: int) -> Shipment:
        """
        Retrieve a single shipment or raise 404.
        """
        shipment = self.db.query(Shipment).filter(Shipment.id == shipment_id).first()
        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shipment not found"
            )
        return shipment

    def get_by_tracking_number(self, tracking_number: str) -> Shipment:
        """
        Retrieve a single shipment by tracking number or raise 404.
        """
        shipment = self.db.query(Shipment).filter(Shipment.tracking_number == tracking_number).first()
        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shipment not found"
            )
        return shipment

    def update_shipment(self, shipment_id: int, shipment_data: ShipmentUpdate, background_tasks: BackgroundTasks = None) -> Shipment:
        """
        Update a shipment. Resolves backward compatibility fields and status mapping.
        """
        shipment = self.get_by_id(shipment_id)
        
        # Convert update schema to dictionary excluding unset fields
        update_dict = shipment_data.model_dump(exclude_unset=True)
        
        # Resolve compatible fields
        if "origin" in update_dict:
            update_dict["pickup_location"] = update_dict.pop("origin")
        if "destination" in update_dict:
            update_dict["delivery_location"] = update_dict.pop("destination")
        if "status" in update_dict:
            update_dict["current_status"] = update_dict.pop("status")
        if "driver_id" in update_dict:
            update_dict["assigned_driver_id"] = update_dict.pop("driver_id")
        if "vehicle_id" in update_dict:
            update_dict["assigned_vehicle_id"] = update_dict.pop("vehicle_id")

        # Perform updates
        for key, value in update_dict.items():
            setattr(shipment, key, value)
            
        # Sync with Trip if status changed
        if "current_status" in update_dict and shipment.trip:
            from app.models.trip import TripStatus
            if update_dict["current_status"] == ShipmentStatus.IN_TRANSIT:
                shipment.trip.trip_status = TripStatus.IN_TRANSIT
                import os
                is_production = os.getenv("ENVIRONMENT") == "production"
                if not is_production:
                    from app.websocket.simulator import start_simulation
                    if background_tasks:
                        background_tasks.add_task(start_simulation, shipment.tracking_number)
            elif update_dict["current_status"] == ShipmentStatus.DELIVERED:
                shipment.trip.trip_status = TripStatus.COMPLETED
            elif update_dict["current_status"] == ShipmentStatus.CANCELLED:
                shipment.trip.trip_status = TripStatus.CANCELLED

        self.db.commit()
        self.db.refresh(shipment)
        return shipment

    def delete_shipment(self, shipment_id: int) -> None:
        """
        Delete a shipment.
        """
        shipment = self.get_by_id(shipment_id)
        self.db.delete(shipment)
        self.db.commit()
