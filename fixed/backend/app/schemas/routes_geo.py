from app.schemas.common import ORMModel


class TripRouteRead(ORMModel):
    trip_id: int
    pickup_location: str
    destination: str
    distance_text: str
    distance_meters: float
    estimated_travel_time: str
    duration_seconds: float
    route_summary: str
    polyline: str | None = None
