from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class FuelBase(BaseModel):
    vehicle_id: int
    driver_id: int
    liters: Optional[float] = None
    fuel_quantity: Optional[float] = None
    cost_per_liter: Optional[float] = None
    total_cost: Optional[float] = None
    fuel_cost: Optional[float] = None
    odometer_reading: Optional[float] = None
    log_date: Optional[date] = None
    fuel_date: Optional[date] = None
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def populate_synonyms(cls, data):
        if isinstance(data, dict):
            qty = data.get("fuel_quantity") if data.get("fuel_quantity") is not None else data.get("liters")
            data["liters"] = qty
            data["fuel_quantity"] = qty

            cost = data.get("fuel_cost") if data.get("fuel_cost") is not None else data.get("total_cost")
            data["total_cost"] = cost
            data["fuel_cost"] = cost

            fdate = data.get("fuel_date") if data.get("fuel_date") is not None else data.get("log_date")
            data["log_date"] = fdate
            data["fuel_date"] = fdate
        return data


class FuelCreate(FuelBase):
    @model_validator(mode="after")
    def check_validations(self):
        qty = self.fuel_quantity if self.fuel_quantity is not None else self.liters
        if qty is None or qty <= 0:
            raise ValueError("Fuel quantity must be greater than zero.")

        cost = self.fuel_cost if self.fuel_cost is not None else self.total_cost
        if cost is None or cost <= 0:
            raise ValueError("Fuel cost must be greater than zero.")

        return self


class FuelUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    liters: Optional[float] = None
    fuel_quantity: Optional[float] = None
    cost_per_liter: Optional[float] = None
    total_cost: Optional[float] = None
    fuel_cost: Optional[float] = None
    odometer_reading: Optional[float] = None
    log_date: Optional[date] = None
    fuel_date: Optional[date] = None
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def populate_synonyms(cls, data):
        if isinstance(data, dict):
            if "fuel_quantity" in data and "liters" not in data:
                data["liters"] = data["fuel_quantity"]
            elif "liters" in data and "fuel_quantity" not in data:
                data["fuel_quantity"] = data["liters"]

            if "fuel_cost" in data and "total_cost" not in data:
                data["total_cost"] = data["fuel_cost"]
            elif "total_cost" in data and "fuel_cost" not in data:
                data["fuel_cost"] = data["total_cost"]

            if "fuel_date" in data and "log_date" not in data:
                data["log_date"] = data["fuel_date"]
            elif "log_date" in data and "fuel_date" not in data:
                data["fuel_date"] = data["log_date"]
        return data

    @model_validator(mode="after")
    def check_validations(self):
        qty = self.fuel_quantity if self.fuel_quantity is not None else self.liters
        if qty is not None and qty <= 0:
            raise ValueError("Fuel quantity must be greater than zero.")

        cost = self.fuel_cost if self.fuel_cost is not None else self.total_cost
        if cost is not None and cost <= 0:
            raise ValueError("Fuel cost must be greater than zero.")

        return self


class FuelRead(BaseModel):
    id: int
    vehicle_id: int
    driver_id: Optional[int] = None
    liters: float
    fuel_quantity: float
    cost_per_liter: Optional[float] = None
    total_cost: float
    fuel_cost: float
    odometer_reading: Optional[float] = None
    log_date: date
    fuel_date: date
    fuel_station: Optional[str] = None
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def populate_read(cls, data):
        if not isinstance(data, dict):
            liters_val = getattr(data, "liters", 0.0)
            cost_val = getattr(data, "total_cost", 0.0)
            date_val = getattr(data, "log_date", None)
            return {
                "id": getattr(data, "id"),
                "vehicle_id": getattr(data, "vehicle_id"),
                "driver_id": getattr(data, "driver_id", None),
                "liters": liters_val,
                "fuel_quantity": liters_val,
                "cost_per_liter": getattr(data, "cost_per_liter", None),
                "total_cost": cost_val,
                "fuel_cost": cost_val,
                "odometer_reading": getattr(data, "odometer_reading", None),
                "log_date": date_val,
                "fuel_date": date_val,
                "fuel_station": getattr(data, "fuel_station", None),
                "remarks": getattr(data, "remarks", None),
                "created_at": getattr(data, "created_at", None),
            }
        else:
            liters_val = data.get("fuel_quantity", data.get("liters", 0.0))
            cost_val = data.get("fuel_cost", data.get("total_cost", 0.0))
            date_val = data.get("fuel_date", data.get("log_date"))
            data["liters"] = liters_val
            data["fuel_quantity"] = liters_val
            data["total_cost"] = cost_val
            data["fuel_cost"] = cost_val
            data["log_date"] = date_val
            data["fuel_date"] = date_val
            return data
