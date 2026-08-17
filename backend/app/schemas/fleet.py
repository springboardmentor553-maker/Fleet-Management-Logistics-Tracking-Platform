from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from app.models.vehicle import VehicleStatus
from app.models.driver import DriverStatus
from app.models.shipment import ShipmentStatus
from app.models.trip import TripStatus

class DriverLocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

# --- Vehicle Schemas ---
class VehicleCreate(BaseModel):
    make: str
    model: str
    year: int
    license_plate: str
    vin: Optional[str] = None
    status: VehicleStatus = VehicleStatus.ACTIVE
    capacity_weight: Optional[float] = None
    capacity_volume: Optional[float] = None

class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    license_plate: Optional[str] = None
    vin: Optional[str] = None
    status: Optional[VehicleStatus] = None
    capacity_weight: Optional[float] = None
    capacity_volume: Optional[float] = None

class VehicleResponse(BaseModel):
    id: int
    make: str
    model: str
    year: int
    license_plate: str
    vin: Optional[str] = None
    status: VehicleStatus
    capacity_weight: Optional[float] = None
    capacity_volume: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Driver Schemas ---
class DriverUpdate(BaseModel):
    phone_number: Optional[str] = None
    status: Optional[DriverStatus] = None
    license_number: Optional[str] = None

class DriverProfileResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    license_number: str
    phone_number: str
    status: DriverStatus
    created_at: datetime
    updated_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Shipment Schemas ---
class ShipmentCreate(BaseModel):
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    weight: Optional[float] = None
    assigned_driver_id: Optional[int] = None
    assigned_vehicle_id: Optional[int] = None

    # Backward compatibility
    origin: Optional[str] = None
    destination: Optional[str] = None
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None

class ShipmentUpdate(BaseModel):
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    current_status: Optional[ShipmentStatus] = None
    weight: Optional[float] = None
    assigned_driver_id: Optional[int] = None
    assigned_vehicle_id: Optional[int] = None

    # Backward compatibility
    status: Optional[ShipmentStatus] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None

class ShipmentResponse(BaseModel):
    id: int
    tracking_number: str
    sender_name: str
    receiver_name: str
    pickup_location: str
    delivery_location: str
    current_status: ShipmentStatus
    weight: Optional[float] = None
    created_at: datetime
    assigned_driver_id: Optional[int] = None
    assigned_vehicle_id: Optional[int] = None

    # Backward compatibility fields to prevent front-end breaks
    shipment_number: str
    origin: str
    destination: str
    status: str
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    trip_id: Optional[int] = None

    class Config:
        from_attributes = True


# --- Trip Schemas ---
class TripCreate(BaseModel):
    shipment_id: int
    driver_id: int
    vehicle_id: int
    pickup_location: str
    destination: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime

class TripUpdate(BaseModel):
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    pickup_location: Optional[str] = None
    destination: Optional[str] = None
    scheduled_start_time: Optional[datetime] = None
    scheduled_end_time: Optional[datetime] = None
    trip_status: Optional[TripStatus] = None

class TripLocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class TripResponse(BaseModel):
    id: int
    shipment_id: int
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    pickup_location: str
    destination: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    trip_status: TripStatus
    created_at: datetime
    
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    distance_km: Optional[float] = None
    estimated_duration: Optional[str] = None
    route_summary: Optional[str] = None
    route_geometry: Optional[Any] = None

    class Config:
        from_attributes = True

# --- Maintenance Schemas ---
from app.models.maintenance import MaintenanceCategory, MaintenanceStatus

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    maintenance_category: MaintenanceCategory
    service_date: datetime
    next_service_date: Optional[datetime] = None
    service_cost: Optional[float] = None
    service_provider: Optional[str] = None
    maintenance_status: MaintenanceStatus = MaintenanceStatus.SCHEDULED
    notes: Optional[str] = None

class MaintenanceUpdate(BaseModel):
    maintenance_category: Optional[MaintenanceCategory] = None
    service_date: Optional[datetime] = None
    next_service_date: Optional[datetime] = None
    service_cost: Optional[float] = None
    service_provider: Optional[str] = None
    maintenance_status: Optional[MaintenanceStatus] = None
    notes: Optional[str] = None

class MaintenanceResponse(BaseModel):
    id: int
    vehicle_id: int
    maintenance_category: MaintenanceCategory
    service_date: datetime
    next_service_date: Optional[datetime] = None
    service_cost: Optional[float] = None
    service_provider: Optional[str] = None
    maintenance_status: MaintenanceStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class MaintenanceAlertResponse(BaseModel):
    maintenance_id: Optional[int] = None
    vehicle_id: int
    vehicle: str
    license_plate: str
    category: Optional[str] = None
    next_service_date: Optional[datetime] = None
    alert: str
    alert_type: str

class MaintenanceSummaryResponse(BaseModel):
    total_records: int
    completed: int
    in_progress: int
    overdue: int
    due_soon: int
    total_cost: float
    average_cost: float
    highest_cost: float

class CategorySummary(BaseModel):
    category: str
    count: int
    total_cost: float

class VehicleSummary(BaseModel):
    vehicle_id: int
    vehicle: str
    maintenance_count: int
    total_cost: float

class StatusSummary(BaseModel):
    status: str
    count: int

class MaintenanceReportResponse(BaseModel):
    total_records: int
    completed: int
    in_progress: int
    scheduled: int
    cancelled: int = 0
    overdue: int
    total_cost: float
    category_summary: list[CategorySummary]
    vehicle_summary: list[VehicleSummary]
    status_summary: list[StatusSummary]

# --- Driver Assignment & Monitoring Schemas ---
class TripAssignRequest(BaseModel):
    driver_id: int
    vehicle_id: int

class DriverMonitoringResponse(BaseModel):
    driver_id: int
    name: str
    email: str
    phone: str
    license_number: str
    status: str
    active_trip_id: Optional[int] = None
    assigned_vehicle_id: Optional[int] = None

class AvailableDriverResponse(BaseModel):
    driver_id: int
    name: str
    status: str

class AvailableVehicleResponse(BaseModel):
    vehicle_id: int
    make: str
    model: str
    license_plate: str
    vin: Optional[str] = None
    status: str
    capacity_weight: Optional[float] = None
    capacity_volume: Optional[float] = None

# --- Fleet Performance Schemas ---
class FleetPerformanceResponse(BaseModel):
    fleet_size: int
    active_vehicles: int
    maintenance: int
    on_trip: int
    vehicle_utilization: float
    driver_utilization: float
    delivery_success_rate: float
    completed_trips: int
    active_trips: int

class FleetSummaryResponse(BaseModel):
    fleet_health: float
    active_drivers: int
    active_vehicles: int
    deliveries_today: int
    maintenance_due: int
    fuel_usage_summary: float

class ChartDataPoint(BaseModel):
    name: str
    value: float | int

class FleetChartsResponse(BaseModel):
    vehicle_status: list[ChartDataPoint]
    shipment_status: list[ChartDataPoint]
    driver_availability: list[ChartDataPoint]
    monthly_trips: list[ChartDataPoint]
    monthly_deliveries: list[ChartDataPoint]
    vehicle_utilization_trend: list[ChartDataPoint]
