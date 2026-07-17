from sqlalchemy.orm import Session

from app.models.user import User
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment


def get_dashboard_data(
    db: Session
):

    return {
        "total_users": db.query(User).count(),
        "total_drivers": db.query(Driver).count(),
        "total_vehicles": db.query(Vehicle).count(),
        "total_shipments": db.query(Shipment).count()
    }