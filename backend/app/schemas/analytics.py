from pydantic import BaseModel
from typing import List

class FleetMetrics(BaseModel):
    totalVehicles: int
    activeVehicles: int
    vehiclesUnderMaintenance: int
    inactiveVehicles: int

class DriverMetrics(BaseModel):
    totalDrivers: int
    availableDrivers: int
    driversOnTrip: int
    offDutyDrivers: int
    driversAssigned: int = 0
    driversOnLeave: int = 0
    driversPresent: int = 0
    driversAbsent: int = 0

class ShipmentMetrics(BaseModel):
    totalShipments: int
    pendingShipments: int
    assignedShipments: int
    inTransitShipments: int
    deliveredShipments: int
    cancelledShipments: int
    delayedShipments: int

class TripMetrics(BaseModel):
    totalTrips: int
    completedTrips: int
    activeTrips: int
    cancelledTrips: int

class DeliveryPerformance(BaseModel):
    totalDeliveries: int
    completed: int
    delayed: int
    cancelled: int
    successRate: float

class DriverStats(BaseModel):
    driver: str
    completedTrips: int
    activeTrips: int
    cancelledTrips: int
    status: str
    assignedVehicle: str | None = None
    lastUpdated: str | None = None

class VehicleStats(BaseModel):
    vehicleName: str
    licensePlate: str
    totalTrips: int
    maintenanceCount: int
    status: str
    capacity: str | None = None
    currentAssignment: str | None = None

class AnalyticsResponse(BaseModel):
    fleet: FleetMetrics
    drivers: DriverMetrics
    shipments: ShipmentMetrics
    trips: TripMetrics
    deliveryPerformance: DeliveryPerformance
    driverPerformance: List[DriverStats]
    vehicleUtilization: List[VehicleStats]

class OverviewAnalyticsResponse(BaseModel):
    total_trips: int
    completed_trips: int
    active_trips: int
    cancelled_trips: int
    total_shipments: int
    delivered_shipments: int
    active_deliveries: int
    delayed_shipments: int
    total_drivers: int
    available_drivers: int
    drivers_on_trip: int
    total_vehicles: int
    active_vehicles: int
    maintenance_vehicles: int

class DriverAnalyticsResponse(BaseModel):
    total_drivers: int
    available: int
    on_trip: int
    on_leave: int
    attendance_today: int
    utilization_percentage: float

class VehicleAnalyticsResponse(BaseModel):
    active_vehicles: int
    maintenance_vehicles: int
    inactive_vehicles: int
    utilization_percentage: float

class ShipmentAnalyticsResponse(BaseModel):
    pending: int
    assigned: int
    picked_up: int
    in_transit: int
    out_for_delivery: int
    delivered: int
    cancelled: int
    delayed: int

class TripAnalyticsResponse(BaseModel):
    total_trips: int
    completed: int
    active: int
    cancelled: int
    completion_rate: float
