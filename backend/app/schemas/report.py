from pydantic import BaseModel


class MaintenanceReportResponse(BaseModel):
    totalMaintenanceRecords: int
    vehiclesUnderMaintenance: int
    completedServices: int
    overdueServices: int
    totalMaintenanceCost: float
    mostFrequentMaintenanceCategory: str