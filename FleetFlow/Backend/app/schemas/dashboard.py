from typing import Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_vehicles: int
    available_vehicles: int
    in_transit_vehicles: int
    total_drivers: int
    active_drivers: int
    total_shipments: int
    pending_shipments: int
    in_transit_shipments: int
    delivered_shipments: int
    cancelled_shipments: int


class AdminDashboardStats(BaseModel):
    total_users: int
    active_users: int
    admin_count: int
    fleet_manager_count: int
    dispatcher_count: int
    driver_count: int
    total_vehicles: int
    total_drivers: int
    total_shipments: int
    delivered_shipments: int


class FleetManagerDashboardStats(BaseModel):
    total_vehicles: int
    available_vehicles: int
    in_transit_vehicles: int
    in_maintenance_vehicles: int
    total_drivers: int
    available_drivers: int
    on_trip_drivers: int


class DispatcherDashboardStats(BaseModel):
    total_shipments: int
    pending_shipments: int
    in_transit_shipments: int
    delivered_shipments: int
    cancelled_shipments: int
    available_drivers: int
    available_vehicles: int


class DriverDashboardStats(BaseModel):
    driver_name: str
    driver_email: str
    assigned_shipments: int
    pending_deliveries: int
    completed_deliveries: int
    active_trip_id: Optional[int] = None
    vehicle_license_plate: Optional[str] = None

