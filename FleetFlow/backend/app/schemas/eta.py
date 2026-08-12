from datetime import datetime

from pydantic import BaseModel


class ETAResponse(BaseModel):
    trip_id: int
    distance_km: float
    estimated_duration_minutes: float
    estimated_arrival_time: datetime