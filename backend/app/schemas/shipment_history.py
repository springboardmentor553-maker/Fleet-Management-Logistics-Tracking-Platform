from pydantic import BaseModel
from datetime import datetime


class ShipmentHistoryResponse(BaseModel):
    id: int
    shipment_id: int
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True