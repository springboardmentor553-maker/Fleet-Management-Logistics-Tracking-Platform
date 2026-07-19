from pydantic import BaseModel


class ShipmentBase(BaseModel):
    source: str
    destination: str
    status: str


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(ShipmentBase):
    pass


class ShipmentResponse(ShipmentBase):
    id: int

    class Config:
        from_attributes = True