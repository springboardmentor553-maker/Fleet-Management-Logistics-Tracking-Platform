from pydantic import BaseModel


class MonthlyShipment(BaseModel):
    month: str
    shipments: int


class VehiclePerformance(BaseModel):
    vehicle: str
    completedTrips: int


class DriverPerformance(BaseModel):
    driver: str
    completedTrips: int


class FleetDashboardResponse(BaseModel):
    totalVehicles: int
    activeVehicles: int
    vehiclesUnderMaintenance: int

    totalDrivers: int
    availableDrivers: int
    assignedDrivers: int

    totalTrips: int
    completedTrips: int

    activeShipments: int

    monthlyShipments: list[MonthlyShipment]
    vehiclePerformance: list[VehiclePerformance]
    driverPerformance: list[DriverPerformance]