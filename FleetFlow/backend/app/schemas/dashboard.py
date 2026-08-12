from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_users: int
    total_drivers: int
    total_vehicles: int
    total_shipments: int
    active_deliveries: int
    delivered_shipments: int
    delayed_shipments: int