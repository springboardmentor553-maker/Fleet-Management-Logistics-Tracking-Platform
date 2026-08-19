from datetime import datetime

from pydantic import BaseModel

from app.models.route import RouteStatus


class RouteBase(BaseModel):
    route_name: str
    source: str
    destination: str
    distance: float
    estimated_time: str
    driver_id: int | None = None
    vehicle_id: int | None = None


class RouteCreate(RouteBase):
    pass


class RouteUpdate(RouteBase):
    status: RouteStatus


class RouteResponse(RouteBase):
    id: int
    status: RouteStatus
    created_at: datetime

    class Config:
        from_attributes = True