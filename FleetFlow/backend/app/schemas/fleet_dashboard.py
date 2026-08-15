from pydantic import BaseModel


class FleetDashboardResponse(BaseModel):
    total_vehicles: int
    active_vehicles: int
    vehicles_under_maintenance: int
    total_drivers: int
    available_drivers: int
    assigned_drivers: int
    total_trips: int
    completed_trips: int
    active_shipments: int