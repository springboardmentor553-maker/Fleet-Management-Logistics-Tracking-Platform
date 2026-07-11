from app.schemas.common import ORMModel


class RouteBase(ORMModel):
    name: str
    source: str
    destination: str
    distance_km: float | None = None
    estimated_duration_hours: float | None = None


class RouteCreate(RouteBase):
    pass


class RouteUpdate(ORMModel):
    name: str | None = None
    source: str | None = None
    destination: str | None = None
    distance_km: float | None = None
    estimated_duration_hours: float | None = None


class RouteRead(RouteBase):
    id: int
