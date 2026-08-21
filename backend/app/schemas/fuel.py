from datetime import date

from pydantic import BaseModel


# =====================================================
# CREATE
# =====================================================

class FuelCreate(BaseModel):

    vehicle_id: int
    fuel_date: date
    liters: float
    cost: float
    odometer: int
    fuel_station: str


# =====================================================
# UPDATE
# =====================================================

class FuelUpdate(BaseModel):

    vehicle_id: int | None = None
    fuel_date: date | None = None
    liters: float | None = None
    cost: float | None = None
    odometer: int | None = None
    fuel_station: str | None = None


# =====================================================
# RESPONSE
# =====================================================

class FuelResponse(BaseModel):

    id: int
    vehicle_id: int
    fuel_date: date
    liters: float
    cost: float
    odometer: int
    fuel_station: str

    class Config:
        from_attributes = True