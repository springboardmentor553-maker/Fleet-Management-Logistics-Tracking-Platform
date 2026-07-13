from pydantic import BaseModel


class ShipmentCreate(BaseModel):
    source: str
    destination: str
    driver_id: int
    vehicle_id: int


class ShipmentUpdate(BaseModel):
    source: str
    destination: str
    status: str
    driver_id: int
    vehicle_id: int


class ShipmentResponse(BaseModel):
    id: int
    source: str
    destination: str
    status: str
    driver_id: int
    vehicle_id: int

    class Config:
        from_attributes = True