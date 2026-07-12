from pydantic import BaseModel


class ShipmentCreate(BaseModel):
    tracking_id: str
    origin: str
    destination: str
    status: str = "Pending"


class ShipmentUpdate(BaseModel):
    tracking_id: str | None = None
    origin: str | None = None
    destination: str | None = None
    status: str | None = None


class ShipmentResponse(BaseModel):
    id: int
    tracking_id: str
    origin: str
    destination: str
    status: str

    class Config:
        from_attributes = True