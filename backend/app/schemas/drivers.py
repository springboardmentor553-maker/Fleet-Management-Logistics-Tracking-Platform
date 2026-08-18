from datetime import datetime

from app.schemas.common import ORMModel


class DriverBase(ORMModel):
    user_id: int | None = None
    license_number: str
    phone_number: str
    status: str = "available"


class DriverCreate(DriverBase):
    pass


class DriverUpdate(ORMModel):
    user_id: int | None = None
    license_number: str | None = None
    phone_number: str | None = None
    status: str | None = None


class DriverRead(DriverBase):
    id: int
    created_at: datetime
    updated_at: datetime