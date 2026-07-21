from pydantic import BaseModel
from typing import Optional, List


class RouteEstimate(BaseModel):
    shipment_id: int
    recommended_driver_id: Optional[int]
    recommended_driver_name: Optional[str]
    recommended_vehicle_id: Optional[int]
    recommended_vehicle_plate: Optional[str]
    route_distance_km: Optional[float]
    reposition_distance_km: Optional[float]
    total_distance_km: Optional[float]
    route_duration_min: Optional[float]
    reposition_duration_min: Optional[float]
    estimated_duration_min: Optional[float]
    route_geometry: Optional[List[List[float]]]
    traffic_factor: float
    origin_lat: Optional[float] = None
    origin_lng: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None

    model_config = {"from_attributes": True}
