from pydantic import BaseModel


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