from pydantic import BaseModel


class RouteResponse(BaseModel):
    pickup_location: str
    destination: str
    distance: str
    estimated_travel_time: str
    route_summary: str