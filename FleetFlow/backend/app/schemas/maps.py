from pydantic import BaseModel


class RouteRequest(BaseModel):
    origin: str
    destination: str


class RouteResponse(BaseModel):
    distance_km: float
    duration_minutes: float
    eta: str