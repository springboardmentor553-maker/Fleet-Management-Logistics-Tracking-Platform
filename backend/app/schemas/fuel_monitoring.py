from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


# ==========================================================
# CREATE FUEL RECORD
# ==========================================================

class FuelRecordCreate(BaseModel):

    vehicle_id: int = Field(
        ...,
        gt=0,
    )

    trip_id: Optional[int] = Field(
        default=None,
        gt=0,
    )

    fuel_consumed_liters: float = Field(
        ...,
        gt=0,
    )

    distance_km: float = Field(
        ...,
        ge=0,
    )

    odometer_km: Optional[float] = Field(
        default=None,
        ge=0,
    )

    fuel_type: Optional[str] = Field(
        default=None,
        max_length=30,
    )

    notes: Optional[str] = Field(
        default=None,
        max_length=500,
    )


# ==========================================================
# UPDATE FUEL RECORD
# ==========================================================

class FuelRecordUpdate(BaseModel):

    vehicle_id: Optional[int] = Field(
        default=None,
        gt=0,
    )

    trip_id: Optional[int] = Field(
        default=None,
        gt=0,
    )

    fuel_consumed_liters: Optional[float] = Field(
        default=None,
        gt=0,
    )

    distance_km: Optional[float] = Field(
        default=None,
        ge=0,
    )

    odometer_km: Optional[float] = Field(
        default=None,
        ge=0,
    )

    fuel_type: Optional[str] = Field(
        default=None,
        max_length=30,
    )

    notes: Optional[str] = Field(
        default=None,
        max_length=500,
    )


# ==========================================================
# RESPONSE
# ==========================================================

class FuelRecordResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    vehicle_id: int

    trip_id: Optional[int] = None

    fuel_consumed_liters: float

    distance_km: float

    odometer_km: Optional[float] = None

    fuel_type: Optional[str] = None

    notes: Optional[str] = None

    created_at: datetime


# ==========================================================
# SUMMARY
# ==========================================================

class FuelSummaryResponse(BaseModel):

    total_fuel_consumed: float

    average_consumption: float

    total_distance: float

    average_mileage: float

    total_records: int


# ==========================================================
# VEHICLE PERFORMANCE
# ==========================================================

class VehicleFuelPerformance(BaseModel):

    vehicle_id: int

    vehicle_number: str

    registration_number: str

    fuel_type: Optional[str] = None

    total_fuel_consumed: float

    total_distance: float

    average_consumption: float

    average_mileage: float


# ==========================================================
# ALERT
# ==========================================================

class FuelAlert(BaseModel):

    vehicle_id: int

    vehicle_number: str

    registration_number: str

    average_consumption: float

    average_mileage: float

    alert_type: str

    message: str


# ==========================================================
# COMPLETE MONITORING RESPONSE
# ==========================================================

class FuelMonitoringResponse(BaseModel):

    summary: FuelSummaryResponse

    vehicle_performance: list[
        VehicleFuelPerformance
    ]

    alerts: list[
        FuelAlert
    ]