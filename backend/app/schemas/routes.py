from datetime import datetime

from app.schemas.common import ORMModel


class RouteBase(ORMModel):
    trip_id: int
    source_latitude: float
    source_longitude: float
    destination_latitude: float
    destination_longitude: float
    distance: float
    estimated_time: float


class RouteCreate(RouteBase):
    pass


class RouteUpdate(ORMModel):
    trip_id: int | None = None
    source_latitude: float | None = None
    source_longitude: float | None = None
    destination_latitude: float | None = None
    destination_longitude: float | None = None
    distance: float | None = None
    estimated_time: float | None = None


class RouteRead(RouteBase):
    id: int
    created_at: datetime | None = None