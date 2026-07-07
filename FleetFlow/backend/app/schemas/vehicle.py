from pydantic import BaseModel, ConfigDict, Field

from app.models.core import VehicleStatusEnum


class VehicleBase(BaseModel):
    registration_number: str = Field(min_length=1)
    vehicle_type: str = Field(min_length=1)
    capacity: float = Field(gt=0)
    fuel_type: str = Field(min_length=1)
    current_status: VehicleStatusEnum = VehicleStatusEnum.AVAILABLE
    manager_id: int | None = None
    driver_id: int | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    registration_number: str | None = None
    vehicle_type: str | None = None
    capacity: float | None = Field(default=None, gt=0)
    fuel_type: str | None = None
    current_status: VehicleStatusEnum | None = None
    manager_id: int | None = None
    driver_id: int | None = None


class VehicleRead(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int