from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
import random

from app.models.vehicle import Vehicle, VehicleStatus
from app.models.driver import Driver, DriverStatus
from app.models.shipment import Shipment, ShipmentStatus
from app.models.trip import Trip, TripStatus
from app.models.maintenance import Maintenance, MaintenanceStatus
from app.schemas.fleet import (
    FleetPerformanceResponse, FleetSummaryResponse, FleetChartsResponse, ChartDataPoint
)

class FleetPerformanceService:
    def __init__(self, db: Session):
        self.db = db

    def get_performance_metrics(self) -> FleetPerformanceResponse:
        total_vehicles = self.db.query(Vehicle).count()
        active_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).count()
        maintenance_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()
        
        total_drivers = self.db.query(Driver).count()
        drivers_on_trip = self.db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()
        
        # Vehicles on trip could be considered those assigned to an active trip
        on_trip_vehicles = self.db.query(Trip).filter(Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])).count()

        vehicle_utilization = (active_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0.0
        driver_utilization = (drivers_on_trip / total_drivers * 100) if total_drivers > 0 else 0.0

        total_deliveries = self.db.query(Shipment).count()
        cancelled_deliveries = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.CANCELLED).count()
        successful_deliveries = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELIVERED).count()
        
        valid_deliveries = total_deliveries - cancelled_deliveries
        delivery_success_rate = (successful_deliveries / valid_deliveries * 100) if valid_deliveries > 0 else 0.0

        completed_trips = self.db.query(Trip).filter(Trip.trip_status == TripStatus.COMPLETED).count()
        active_trips = self.db.query(Trip).filter(Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])).count()

        return FleetPerformanceResponse(
            fleet_size=total_vehicles,
            active_vehicles=active_vehicles,
            maintenance=maintenance_vehicles,
            on_trip=on_trip_vehicles,
            vehicle_utilization=round(vehicle_utilization, 2),
            driver_utilization=round(driver_utilization, 2),
            delivery_success_rate=round(delivery_success_rate, 2),
            completed_trips=completed_trips,
            active_trips=active_trips
        )

    def get_summary(self) -> FleetSummaryResponse:
        # A simulated health score based on maintenance vs active vehicles
        total_vehicles = self.db.query(Vehicle).count()
        maintenance_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()
        health_score = 100.0
        if total_vehicles > 0:
            health_score = 100.0 - ((maintenance_vehicles / total_vehicles) * 100.0)

        active_drivers = self.db.query(Driver).filter(Driver.status.in_([DriverStatus.AVAILABLE, DriverStatus.ON_TRIP])).count()
        active_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).count()
        
        today = date.today()
        deliveries_today = self.db.query(Shipment).filter(
            func.date(Shipment.created_at) == today, 
            Shipment.current_status == ShipmentStatus.DELIVERED
        ).count()

        # Overdue or due soon maintenance
        maintenance_due = self.db.query(Maintenance).filter(
            Maintenance.maintenance_status == MaintenanceStatus.SCHEDULED,
            Maintenance.next_service_date <= today + timedelta(days=7)
        ).count()

        # Dynamic fuel usage sum
        from app.models.fuel_record import FuelRecordModel
        fuel_usage_summary = self.db.query(func.sum(FuelRecordModel.fuel_quantity)).scalar() or 0.0

        return FleetSummaryResponse(
            fleet_health=round(health_score, 1),
            active_drivers=active_drivers,
            active_vehicles=active_vehicles,
            deliveries_today=deliveries_today,
            maintenance_due=maintenance_due,
            fuel_usage_summary=fuel_usage_summary
        )

    def get_charts_data(self) -> FleetChartsResponse:
        # Vehicle Status
        v_active = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).count()
        v_maint = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()
        v_inactive = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.INACTIVE).count()
        vehicle_status = [
            ChartDataPoint(name="Active", value=v_active),
            ChartDataPoint(name="Maintenance", value=v_maint),
            ChartDataPoint(name="Inactive", value=v_inactive)
        ]

        # Shipment Status
        s_pending = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.CREATED).count()
        s_transit = self.db.query(Shipment).filter(Shipment.current_status.in_([ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY])).count()
        s_delivered = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELIVERED).count()
        s_delayed = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELAYED).count()
        shipment_status = [
            ChartDataPoint(name="Pending", value=s_pending),
            ChartDataPoint(name="In Transit", value=s_transit),
            ChartDataPoint(name="Delivered", value=s_delivered),
            ChartDataPoint(name="Delayed", value=s_delayed)
        ]

        # Driver Availability
        d_avail = self.db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).count()
        d_trip = self.db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()
        d_off = self.db.query(Driver).filter(Driver.status == DriverStatus.OFF_DUTY).count()
        driver_availability = [
            ChartDataPoint(name="Available", value=d_avail),
            ChartDataPoint(name="On Trip", value=d_trip),
            ChartDataPoint(name="Off Duty", value=d_off)
        ]

        # Dynamic monthly aggregations using SQLAlchemy's extract function
        import calendar
        from sqlalchemy import extract
        
        # Aggregate trips by month
        trips_by_month = self.db.query(
            extract('month', Trip.created_at).label('month'),
            func.count(Trip.id).label('count')
        ).group_by(extract('month', Trip.created_at)).all()
        
        trip_counts = {int(row.month): row.count for row in trips_by_month}
        
        # Aggregate shipments by month
        shipments_by_month = self.db.query(
            extract('month', Shipment.created_at).label('month'),
            func.count(Shipment.id).label('count')
        ).group_by(extract('month', Shipment.created_at)).all()
        
        shipment_counts = {int(row.month): row.count for row in shipments_by_month}
        
        monthly_trips = []
        monthly_deliveries = []
        
        # Ensure we always return the last 6 months up to current month for a consistent chart
        current_month = datetime.now().month
        months_to_show = [(current_month - i - 1) % 12 + 1 for i in range(5, -1, -1)]
        
        for m in months_to_show:
            month_name = calendar.month_abbr[m]
            monthly_trips.append(ChartDataPoint(name=month_name, value=trip_counts.get(m, 0)))
            monthly_deliveries.append(ChartDataPoint(name=month_name, value=shipment_counts.get(m, 0)))
        
        # Dynamic day-of-week aggregations using SQLAlchemy's extract function
        # extract('dow', created_at) returns 0-6 where 0=Sunday, 1=Monday... (in Postgres)
        # Note: Depending on the database dialect, 'dow' might behave differently. 
        # Using a safer approach with 'isodow' (1=Mon, 7=Sun) for PostgreSQL
        from sqlalchemy.exc import CompileError
        
        try:
            trips_by_dow = self.db.query(
                extract('isodow', Trip.created_at).label('dow'),
                func.count(Trip.id).label('count')
            ).filter(Trip.trip_status.in_([TripStatus.IN_TRANSIT, TripStatus.COMPLETED])).group_by(extract('isodow', Trip.created_at)).all()
            
            dow_counts = {int(row.dow): row.count for row in trips_by_dow}
        except CompileError:
            # Fallback for SQLite which doesn't support 'isodow'
            trips_by_dow = self.db.query(Trip).all()
            dow_counts = {}
            for t in trips_by_dow:
                dow = t.created_at.isoweekday()
                dow_counts[dow] = dow_counts.get(dow, 0) + 1
        
        days = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"}
        
        # Calculate utilization as percentage: (trips on day / total vehicles) * 100
        # This is a simplification; actual utilization might involve hours, but this removes hardcodes
        total_vehicles_count = self.db.query(Vehicle).count() or 1
        
        vehicle_utilization_trend = []
        for i in range(1, 8):
            day_trips = dow_counts.get(i, 0)
            utilization_pct = min(100, int((day_trips / total_vehicles_count) * 100))
            vehicle_utilization_trend.append(ChartDataPoint(name=days[i], value=utilization_pct))

        return FleetChartsResponse(
            vehicle_status=vehicle_status,
            shipment_status=shipment_status,
            driver_availability=driver_availability,
            monthly_trips=monthly_trips,
            monthly_deliveries=monthly_deliveries,
            vehicle_utilization_trend=vehicle_utilization_trend
        )
