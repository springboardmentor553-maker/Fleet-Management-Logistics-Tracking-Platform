from sqlalchemy.orm import Session

from app.models.user import User
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.enums.shipment_status import ShipmentStatus


def get_dashboard_data(db: Session):

    total_shipments = db.query(Shipment).count()

    active_deliveries = (
        db.query(Shipment)
        .filter(
            Shipment.current_status.in_([
                ShipmentStatus.ASSIGNED.value,
                ShipmentStatus.PICKED_UP.value,
                ShipmentStatus.IN_TRANSIT.value,
                ShipmentStatus.OUT_FOR_DELIVERY.value
            ])
        )
        .count()
    )

    delivered_shipments = (
        db.query(Shipment)
        .filter(
            Shipment.current_status == ShipmentStatus.DELIVERED.value
        )
        .count()
    )

    delayed_shipments = (
        db.query(Shipment)
        .filter(
            Shipment.current_status == ShipmentStatus.DELAYED.value
        )
        .count()
    )

    return {
        "total_users": db.query(User).count(),
        "total_drivers": db.query(Driver).count(),
        "total_vehicles": db.query(Vehicle).count(),
        "total_shipments": total_shipments,
        "active_deliveries": active_deliveries,
        "delivered_shipments": delivered_shipments,
        "delayed_shipments": delayed_shipments
    }