from pydantic import BaseModel


class DriverBase(BaseModel):
    name: str
    phone: str
    license_number: str


class DriverCreate(DriverBase):
    pass


class DriverUpdate(DriverBase):
    pass


class DriverResponse(DriverBase):
    id: int

    class Config:
        from_attributes = True