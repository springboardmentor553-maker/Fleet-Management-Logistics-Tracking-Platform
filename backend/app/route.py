from pydantic import BaseModel


class GeocodeRequest(BaseModel):
    location: str


class GeocodeResponse(BaseModel):
    latitude: float
    longitude: float


class RouteRequest(BaseModel):
    pickup_latitude: float
    pickup_longitude: float
    destination_latitude: float
    destination_longitude: float


class RouteResponse(BaseModel):
    distance_km: float
    duration_minutes: float
    geometry: dict