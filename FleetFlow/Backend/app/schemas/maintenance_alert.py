from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# ─── Request schemas ──────────────────────────────────────────────────────────

class MaintenanceAlertCreate(BaseModel):
    vehicle_id:       int    = Field(..., example=1, description="Vehicle this alert belongs to")
    maintenance_id:   int    = Field(..., example=1, description="Maintenance record this alert is for")
    alert_message:    str    = Field(..., example="Service due in 3 days", description="Human-readable alert message")
    alert_type:       str    = Field(default="service_due",
                                     example="service_due",
                                     description="service_due | overdue | health_critical | upcoming")
    alert_status:     str    = Field(default="Pending",
                                     example="Pending",
                                     description="Pending | Sent | Completed")
    next_service_date: Optional[datetime] = Field(None, example="2026-09-01T00:00:00")


class MaintenanceAlertUpdate(BaseModel):
    alert_status:  Optional[str] = Field(None,
                                          example="Sent",
                                          description="Pending | Sent | Completed")
    alert_message: Optional[str] = None
    alert_type:    Optional[str] = None
    next_service_date: Optional[datetime] = None


# ─── Response schema ──────────────────────────────────────────────────────────

class MaintenanceAlertResponse(BaseModel):
    id:                int
    vehicle_id:        int
    maintenance_id:    int
    alert_message:     str
    alert_type:        str
    alert_status:      str
    generated_date:    datetime
    next_service_date: Optional[datetime] = None
    created_at:        datetime

    model_config = {"from_attributes": True}


# ─── Maintenance Report response ──────────────────────────────────────────────

class MaintenanceReportResponse(BaseModel):
    total_records:                  int
    vehicles_under_maintenance:     int
    completed_services:             int
    overdue_services:               int
    total_maintenance_cost:         float
    most_frequent_category:         Optional[str] = None
    pending_alerts:                 int
    sent_alerts:                    int
    completed_alerts:               int
