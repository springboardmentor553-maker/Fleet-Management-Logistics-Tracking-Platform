from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums import DriverStatus


class DriverCreate(BaseModel):
    account_id: int
    license_number: str = Field(min_length=3, max_length=40)
    license_expiry: date


class DriverUpdate(BaseModel):
    license_number: str | None = Field(default=None, min_length=3, max_length=40)
    license_expiry: date | None = None
    status: DriverStatus | None = None


class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int
    license_number: str
    license_expiry: date
    status: DriverStatus
    created_at: datetime
