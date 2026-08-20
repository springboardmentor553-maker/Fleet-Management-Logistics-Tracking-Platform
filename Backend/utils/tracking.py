from sqlalchemy.orm import Session

from app.models.shipment import Shipment


def generate_tracking_number(db: Session):

    count = db.query(Shipment).count()

    number = count + 1

    return f"FLT{number:06d}"