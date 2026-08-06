from pydantic import BaseModel


class FuelAnalyticsResponse(BaseModel):
    totalFuelConsumed: float
    totalFuelCost: float
    averageFuelConsumption: float

    highestFuelUsageVehicle: str
    lowestFuelUsageVehicle: str

class OperationsAnalyticsResponse(BaseModel):
    totalDeliveries: int
    successfulDeliveries: int
    delayedDeliveries: int
    cancelledDeliveries: int
    averageTripDistance: float
    averageDeliveryTime: float