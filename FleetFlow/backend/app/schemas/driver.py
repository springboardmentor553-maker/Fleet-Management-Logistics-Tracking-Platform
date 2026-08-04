from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

from app.models.enums import DriverStatusEnum


class DriverCreate(BaseModel):
    """Attach a driver profile (license details) to an existing user."""

    user_id: int
    license_details: str = Field(min_length=3, description="License number or description")


class DriverRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:              int
    user_id:         int
    license_details: str
    status:          Optional[DriverStatusEnum] = DriverStatusEnum.AVAILABLE
    name:            Optional[str] = None

class DriverUpdate(BaseModel):
    license_details: str | None = Field(default=None, min_length=3)
