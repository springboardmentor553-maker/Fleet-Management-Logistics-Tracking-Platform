from sqlalchemy import Column, Integer, String
from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)

    shipment_id = Column(Integer, nullable=False)
    vehicle_id = Column(Integer, nullable=False)
    driver_id = Column(Integer, nullable=False)

    start_location = Column(String, nullable=False)
    end_location = Column(String, nullable=False)

    departure_time = Column(String)
    expected_arrival = Column(String)
    
    current_latitude = Column(String)
    current_longitude = Column(String)

    destination_latitude = Column(String)
    destination_longitude = Column(String) 

    status = Column(String, default="Scheduled")