from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FuelRecordBase(BaseModel):
    vehicle_id: int = Field(
        ...,
        description="ID of the vehicle"
    )

    driver_id: int = Field(
        ...,
        description="ID of the driver"
    )

    fuel_quantity: float = Field(
        ...,
        gt=0,
        description="Fuel quantity in Liters"
    )

    fuel_cost: float = Field(
        ...,
        gt=0,
        description="Cost of fuel purchased"
    )

    odometer_reading: float = Field(
        ...,
        ge=0,
        description="Odometer reading at fuel purchase"
    )

    fuel_station: str = Field(
        ...,
        description="Name/Location of the fuel station"
    )

    remarks: Optional[str] = Field(
        None,
        description="Optional remarks"
    )


class FuelRecordCreate(FuelRecordBase):
    fuel_date: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Date of fueling"
    )


class FuelRecordUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None

    fuel_quantity: Optional[float] = Field(
        None,
        gt=0
    )

    fuel_cost: Optional[float] = Field(
        None,
        gt=0
    )

    odometer_reading: Optional[float] = Field(
        None,
        ge=0
    )

    fuel_station: Optional[str] = None
    remarks: Optional[str] = None
    fuel_date: Optional[datetime] = None


class VehicleMiniResponse(BaseModel):
    id: int
    plate_number: str
    model: str

    class Config:
        from_attributes = True


class DriverMiniResponse(BaseModel):
    id: int
    name: str
    license_number: str

    class Config:
        from_attributes = True


class FuelRecordResponse(BaseModel):
    id: int
    vehicle_id: int
    driver_id: int
    fuel_quantity: float
    fuel_cost: float
    odometer_reading: float
    fuel_date: datetime
    fuel_station: str
    remarks: Optional[str]

    vehicle: Optional[VehicleMiniResponse] = None
    driver: Optional[DriverMiniResponse] = None

    class Config:
        from_attributes = True