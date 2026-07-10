from pydantic import BaseModel


class ShipmentCreate(BaseModel):
    shipment_name: str
    source: str
    destination: str
    status: str
    vehicle_id: int


class ShipmentUpdate(BaseModel):
    shipment_name: str
    source: str
    destination: str
    status: str
    vehicle_id: int


class ShipmentResponse(BaseModel):
    id: int
    shipment_name: str
    source: str
    destination: str
    status: str
    vehicle_id: int | None

    class Config:
        from_attributes = True