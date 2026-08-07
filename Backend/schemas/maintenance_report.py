from pydantic import BaseModel


class MaintenanceReportResponse(BaseModel):
    total_maintenance_records: int
    vehicles_under_maintenance: int
    completed_services: int
    overdue_services: int
    total_maintenance_cost: float
    most_frequent_maintenance_category: str