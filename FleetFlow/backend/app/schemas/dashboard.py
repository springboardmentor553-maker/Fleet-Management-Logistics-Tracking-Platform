"""Dashboard summary schema."""

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    # ── Vehicles ──────────────────────────────────────────────────────────────
    total_vehicles: int
    active_vehicles: int
    maintenance_vehicles: int
    available_vehicles: int

    # ── Drivers ───────────────────────────────────────────────────────────────
    total_drivers: int
    on_duty_drivers: int

    # ── Shipments ─────────────────────────────────────────────────────────────
    total_shipments: int
    active_shipments: int      
    delivered_shipments: int
    delayed_shipments: int