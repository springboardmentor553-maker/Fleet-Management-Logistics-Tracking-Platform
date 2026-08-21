from pydantic import BaseModel
from typing import List


# ============================================================
# MAINTENANCE REPORT
# ============================================================

class MaintenanceReportResponse(BaseModel):
    totalMaintenanceRecords: int
    vehiclesUnderMaintenance: int
    completedServices: int
    overdueServices: int
    totalMaintenanceCost: float
    mostFrequentMaintenanceCategory: str


# ============================================================
# FLEET UTILIZATION REPORT
# ============================================================

class FleetUtilizationReportResponse(BaseModel):
    totalVehicles: int
    availableVehicles: int
    vehiclesOnTrip: int
    vehiclesUnderMaintenance: int
    inactiveVehicles: int
    utilizationRate: float


# ============================================================
# FUEL CONSUMPTION REPORT
# ============================================================

class FuelVehicleReport(BaseModel):
    vehicleId: int
    fuelQuantity: float
    fuelCost: float


class FuelConsumptionReportResponse(BaseModel):
    totalFuelRecords: int
    totalFuelQuantity: float
    totalFuelCost: float
    averageFuelCost: float
    vehicleBreakdown: List[FuelVehicleReport]


# ============================================================
# DRIVER PERFORMANCE REPORT
# ============================================================

class DriverPerformanceReport(BaseModel):
    driverId: int
    driverName: str
    totalTrips: int
    completedTrips: int
    activeTrips: int
    cancelledTrips: int


class DriverPerformanceReportResponse(BaseModel):
    totalDrivers: int
    totalTrips: int
    completedTrips: int
    activeTrips: int
    cancelledTrips: int
    bestPerformingDriver: str
    drivers: List[DriverPerformanceReport]


# ============================================================
# DELIVERY PERFORMANCE REPORT
# ============================================================

class DeliveryPerformanceReportResponse(BaseModel):
    totalShipments: int
    deliveredShipments: int
    inTransitShipments: int
    delayedShipments: int
    cancelledShipments: int
    pendingShipments: int
    deliveryCompletionRate: float