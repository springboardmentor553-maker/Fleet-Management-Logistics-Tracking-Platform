from sqlalchemy import Column, Integer, String, Float

from app.database import Base


class Route(Base):
    """
    SQLAlchemy model representing a route.
    """
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)
    source = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)

    distance_km = Column(Float, nullable=True)
    estimated_duration_hours = Column(Float, nullable=True)

    def __repr__(self) -> str:
        return (
            f"<Route(id={self.id}, name='{self.name}', "
            f"source='{self.source}', destination='{self.destination}')>"
        )