from pydantic import BaseModel


class DashboardSummary(BaseModel):
    totalVehicles: int
    active: int
    maintenance: int
    available: int