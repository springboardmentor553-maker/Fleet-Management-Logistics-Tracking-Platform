"""Dashboard summary schema."""

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    # ── Vehicles ──────────────────────────────────────────────────────────────
    totalVehicles: int
    active: int
    maintenance: int
    available: int

    # ── Shipments ─────────────────────────────────────────────────────────────
    totalShipments: int
    activeDeliveries: int      # PICKED_UP + IN_TRANSIT + OUT_FOR_DELIVERY
    deliveredShipments: int
    delayedShipments: int