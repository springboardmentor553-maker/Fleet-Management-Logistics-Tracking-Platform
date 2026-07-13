from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id          = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    driver_id   = Column(Integer, ForeignKey("drivers.id"),   nullable=False)
    vehicle_id  = Column(Integer, ForeignKey("vehicles.id"),  nullable=False)
    start_time  = Column(DateTime, nullable=True)
    end_time    = Column(DateTime, nullable=True)
    status      = Column(String, default="scheduled")  # scheduled, started, completed, cancelled
    created_at  = Column(DateTime, default=datetime.utcnow)

    shipment = relationship("Shipment")
    driver   = relationship("Driver")
    vehicle  = relationship("Vehicle")

    @property
    def shipment_origin(self):
        return self.shipment.origin if self.shipment else None

    @property
    def shipment_destination(self):
        return self.shipment.destination if self.shipment else None

    @property
    def driver_name(self):
        return self.driver.name if self.driver else None

    @property
    def vehicle_plate(self):
        return self.vehicle.plate_number if self.vehicle else None
