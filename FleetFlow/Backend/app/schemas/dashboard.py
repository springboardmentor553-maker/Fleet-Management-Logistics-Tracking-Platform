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
