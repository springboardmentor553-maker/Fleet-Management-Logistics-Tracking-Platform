from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

VEHICLE_TYPES = {"Truck", "Van", "Bike", "Mini Truck", "Container", "Tanker", "Pickup"}
FUEL_TYPES    = {"Petrol", "Diesel", "Electric", "CNG", "Hybrid"}
STATUS_TYPES  = {"available", "in_transit", "maintenance"}


class VehicleCreate(BaseModel):
    plate_number: str = Field(..., example="TN-01-AB-1234", description="Unique vehicle registration number")
    vehicle_type: str = Field(..., example="Truck", description="Truck | Van | Bike | Mini Truck | Container | Tanker | Pickup")
    model: str = Field(..., example="Tata Ace", description="Vehicle model name")
    capacity_kg: float = Field(..., example=1000.0, gt=0, description="Load capacity in kilograms")
    fuel_type: str = Field(..., example="Diesel", description="Petrol | Diesel | Electric | CNG | Hybrid")
    assigned_driver_id: Optional[int] = Field(None, example=1, description="Driver ID to assign (optional)")
    current_status: str = Field("available", example="available", description="available | in_transit | maintenance")

    @field_validator("vehicle_type")
    @classmethod
    def valid_vehicle_type(cls, v: str) -> str:
        if v not in VEHICLE_TYPES:
            raise ValueError(f"vehicle_type must be one of {sorted(VEHICLE_TYPES)}")
        return v

    @field_validator("fuel_type")
    @classmethod
    def valid_fuel_type(cls, v: str) -> str:
        if v not in FUEL_TYPES:
            raise ValueError(f"fuel_type must be one of {sorted(FUEL_TYPES)}")
        return v

    @field_validator("current_status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in STATUS_TYPES:
            raise ValueError(f"current_status must be one of {sorted(STATUS_TYPES)}")
        return v


class VehicleUpdate(BaseModel):
    plate_number: Optional[str] = Field(None, example="TN-01-AB-1234")
    vehicle_type: Optional[str] = Field(None, example="Truck")
    model: Optional[str] = Field(None, example="Tata Ace")
    capacity_kg: Optional[float] = Field(None, example=1000.0, gt=0)
    fuel_type: Optional[str] = Field(None, example="Diesel")
    assigned_driver_id: Optional[int] = Field(None, example=1)
    current_status: Optional[str] = Field(None, example="available")

    @field_validator("vehicle_type")
    @classmethod
    def valid_vehicle_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VEHICLE_TYPES:
            raise ValueError(f"vehicle_type must be one of {sorted(VEHICLE_TYPES)}")
        return v

    @field_validator("fuel_type")
    @classmethod
    def valid_fuel_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in FUEL_TYPES:
            raise ValueError(f"fuel_type must be one of {sorted(FUEL_TYPES)}")
        return v

    @field_validator("current_status")
    @classmethod
    def valid_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in STATUS_TYPES:
            raise ValueError(f"current_status must be one of {sorted(STATUS_TYPES)}")
        return v


class AssignedDriverInfo(BaseModel):
    id: int
    name: str
    license_number: str

    model_config = {"from_attributes": True}


class VehicleResponse(BaseModel):
    id: int
    plate_number: str
    vehicle_type: str
    model: str
    capacity_kg: float
    fuel_type: str
    assigned_driver_id: Optional[int]
    assigned_driver: Optional[AssignedDriverInfo]
    current_status: str
    created_at: datetime

    model_config = {"from_attributes": True}
