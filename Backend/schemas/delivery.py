from pydantic import BaseModel


class DeliveryBase(BaseModel):
    shipment_id: int
    receiver_name: str
    receiver_phone: str
    delivery_status: str
    remarks: str


class DeliveryCreate(DeliveryBase):
    pass


class DeliveryResponse(DeliveryBase):
    id: int

    class Config:
        from_attributes = True
        