from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.driver import Driver, DriverStatus
from app.models.shipment import Shipment, ShipmentStatus
from app.models.trip import Trip, TripStatus
from app.models.maintenance import Maintenance, MaintenanceStatus
from app.models.driver_assignment import DriverAssignment, AssignmentStatus
from app.models.driver_attendance import DriverAttendance, AttendanceStatus
from datetime import date
from app.schemas.analytics import (
    AnalyticsResponse, FleetMetrics, DriverMetrics, ShipmentMetrics,
    TripMetrics, DeliveryPerformance, DriverStats, VehicleStats
)

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_consolidated_analytics(self) -> AnalyticsResponse:
        # 1. Fleet Metrics
        total_vehicles = self.db.query(Vehicle).count()
        active_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).count()
        maintenance_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()
        inactive_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.INACTIVE).count()

        # 2. Driver Metrics
        total_drivers = self.db.query(Driver).count()
        available_drivers = self.db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).count()
        on_trip_drivers = self.db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()
        off_duty_drivers = self.db.query(Driver).filter(Driver.status == DriverStatus.OFF_DUTY).count()

        # Assignment / Attendance metrics
        today = date.today()
        drivers_assigned = self.db.query(DriverAssignment).filter(
            DriverAssignment.assignment_status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE])
        ).count()
        drivers_on_leave = self.db.query(DriverAttendance).filter(DriverAttendance.date == today, DriverAttendance.attendance_status == AttendanceStatus.LEAVE).count()
        drivers_present = self.db.query(DriverAttendance).filter(DriverAttendance.date == today, DriverAttendance.attendance_status == AttendanceStatus.PRESENT).count()
        drivers_absent = self.db.query(DriverAttendance).filter(DriverAttendance.date == today, DriverAttendance.attendance_status == AttendanceStatus.ABSENT).count()

        # 3. Shipment Metrics
        total_shipments = self.db.query(Shipment).count()
        # We use CREATED as PENDING.
        pending_shipments = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.CREATED).count()

        assigned_shipments = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.ASSIGNED).count()
        in_transit_shipments = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.IN_TRANSIT).count()
        delivered_shipments = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELIVERED).count()
        cancelled_shipments = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.CANCELLED).count()
        delayed_shipments = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELAYED).count()

        # 4. Trip Metrics
        total_trips = self.db.query(Trip).count()
        completed_trips = self.db.query(Trip).filter(Trip.trip_status == TripStatus.COMPLETED).count()
        active_trips = self.db.query(Trip).filter(Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])).count()
        cancelled_trips_count = self.db.query(Trip).filter(Trip.trip_status == TripStatus.CANCELLED).count()

        # 5. Delivery Performance
        # "Total Deliveries" = all shipments that are not just created? Let's use total_shipments.
        # "Completed Deliveries" = delivered_shipments
        # "Delayed Deliveries" = delayed_shipments
        # "Cancelled Deliveries" = cancelled_shipments
        total_deliveries = total_shipments
        
        # Calculate success rate
        # Success rate = Completed / (Total Deliveries - Cancelled) * 100
        # If no deliveries, 0%
        valid_deliveries = total_deliveries - cancelled_shipments
        success_rate = (delivered_shipments / valid_deliveries * 100.0) if valid_deliveries > 0 else 0.0

        # 6. Driver Performance
        # Driver Name, Completed Trips, Active Trips, Cancelled Trips, Current Status
        drivers = self.db.query(Driver).all()
        driver_performance = []
        for d in drivers:
            name = d.user.full_name if d.user else "Unknown Driver"
            
            d_completed = self.db.query(Trip).filter(Trip.driver_id == d.id, Trip.trip_status == TripStatus.COMPLETED).count()
            d_active = self.db.query(Trip).filter(Trip.driver_id == d.id, Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])).count()
            d_cancelled = self.db.query(Trip).filter(Trip.driver_id == d.id, Trip.trip_status == TripStatus.CANCELLED).count()
            
            active_trip = self.db.query(Trip).filter(Trip.driver_id == d.id, Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])).first()
            assigned_vehicle = f"{active_trip.vehicle.make} {active_trip.vehicle.model} ({active_trip.vehicle.license_plate})" if active_trip and active_trip.vehicle else None
            last_updated = d.updated_at.isoformat() if hasattr(d, 'updated_at') and d.updated_at else None

            driver_performance.append(DriverStats(
                driver=name,
                completedTrips=d_completed,
                activeTrips=d_active,
                cancelledTrips=d_cancelled,
                status=d.status.value if hasattr(d.status, 'value') else d.status,
                assignedVehicle=assigned_vehicle,
                lastUpdated=last_updated
            ))

        # 7. Vehicle Utilization
        # Vehicle Name, License Plate, Total Trips, Maintenance Count, Current Status
        vehicles = self.db.query(Vehicle).all()
        vehicle_utilization = []
        for v in vehicles:
            v_name = f"{v.make} {v.model}"
            v_total_trips = self.db.query(Trip).filter(Trip.vehicle_id == v.id).count()
            v_maintenance = self.db.query(Maintenance).filter(Maintenance.vehicle_id == v.id).count()
            
            v_capacity = f"{v.capacity_weight or 0}kg / {v.capacity_volume or 0}m³"
            active_trip = self.db.query(Trip).filter(Trip.vehicle_id == v.id, Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])).first()
            current_assignment = active_trip.route_summary if active_trip and hasattr(active_trip, 'route_summary') else None
            if not current_assignment and active_trip:
                current_assignment = f"Trip #{active_trip.id}"
            
            vehicle_utilization.append(VehicleStats(
                vehicleName=v_name,
                licensePlate=v.license_plate,
                totalTrips=v_total_trips,
                maintenanceCount=v_maintenance,
                status=v.status.value if hasattr(v.status, 'value') else v.status,
                capacity=v_capacity,
                currentAssignment=current_assignment
            ))

        # Build response
        return AnalyticsResponse(
            fleet=FleetMetrics(
                totalVehicles=total_vehicles,
                activeVehicles=active_vehicles,
                vehiclesUnderMaintenance=maintenance_vehicles,
                inactiveVehicles=inactive_vehicles
            ),
            drivers=DriverMetrics(
                totalDrivers=total_drivers,
                availableDrivers=available_drivers,
                driversOnTrip=on_trip_drivers,
                offDutyDrivers=off_duty_drivers,
                driversAssigned=drivers_assigned,
                driversOnLeave=drivers_on_leave,
                driversPresent=drivers_present,
                driversAbsent=drivers_absent
            ),
            shipments=ShipmentMetrics(
                totalShipments=total_shipments,
                pendingShipments=pending_shipments,
                assignedShipments=assigned_shipments,
                inTransitShipments=in_transit_shipments,
                deliveredShipments=delivered_shipments,
                cancelledShipments=cancelled_shipments,
                delayedShipments=delayed_shipments
            ),
            trips=TripMetrics(
                totalTrips=total_trips,
                completedTrips=completed_trips,
                activeTrips=active_trips,
                cancelledTrips=cancelled_trips_count
            ),
            deliveryPerformance=DeliveryPerformance(
                totalDeliveries=total_deliveries,
                completed=delivered_shipments,
                delayed=delayed_shipments,
                cancelled=cancelled_shipments,
                successRate=round(success_rate, 2)
            ),
            driverPerformance=driver_performance,
            vehicleUtilization=vehicle_utilization
        )

    def get_overview(self):
        from app.schemas.analytics import OverviewAnalyticsResponse
        
        total_trips = self.db.query(Trip).count()
        completed_trips = self.db.query(Trip).filter(Trip.trip_status == TripStatus.COMPLETED).count()
        active_trips = self.db.query(Trip).filter(Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])).count()
        cancelled_trips = self.db.query(Trip).filter(Trip.trip_status == TripStatus.CANCELLED).count()

        total_shipments = self.db.query(Shipment).count()
        delivered_shipments = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELIVERED).count()
        active_deliveries = self.db.query(Shipment).filter(Shipment.current_status.in_([ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY])).count()
        delayed_shipments = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELAYED).count()

        total_drivers = self.db.query(Driver).count()
        available_drivers = self.db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).count()
        drivers_on_trip = self.db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()

        total_vehicles = self.db.query(Vehicle).count()
        active_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).count()
        maintenance_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()

        return OverviewAnalyticsResponse(
            total_trips=total_trips,
            completed_trips=completed_trips,
            active_trips=active_trips,
            cancelled_trips=cancelled_trips,
            total_shipments=total_shipments,
            delivered_shipments=delivered_shipments,
            active_deliveries=active_deliveries,
            delayed_shipments=delayed_shipments,
            total_drivers=total_drivers,
            available_drivers=available_drivers,
            drivers_on_trip=drivers_on_trip,
            total_vehicles=total_vehicles,
            active_vehicles=active_vehicles,
            maintenance_vehicles=maintenance_vehicles
        )

    def get_drivers(self):
        from app.schemas.analytics import DriverAnalyticsResponse
        total_drivers = self.db.query(Driver).count()
        available = self.db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).count()
        on_trip = self.db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()
        
        today = date.today()
        on_leave = self.db.query(DriverAttendance).filter(DriverAttendance.date == today, DriverAttendance.attendance_status == AttendanceStatus.LEAVE).count()
        attendance_today = self.db.query(DriverAttendance).filter(DriverAttendance.date == today, DriverAttendance.attendance_status == AttendanceStatus.PRESENT).count()

        util_pct = (on_trip / total_drivers * 100.0) if total_drivers > 0 else 0.0

        return DriverAnalyticsResponse(
            total_drivers=total_drivers,
            available=available,
            on_trip=on_trip,
            on_leave=on_leave,
            attendance_today=attendance_today,
            utilization_percentage=round(util_pct, 2)
        )

    def get_vehicles(self):
        from app.schemas.analytics import VehicleAnalyticsResponse
        active_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ACTIVE).count()
        maintenance_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()
        inactive_vehicles = self.db.query(Vehicle).filter(Vehicle.status == VehicleStatus.INACTIVE).count()
        
        total = active_vehicles + maintenance_vehicles + inactive_vehicles
        util_pct = (active_vehicles / total * 100.0) if total > 0 else 0.0

        return VehicleAnalyticsResponse(
            active_vehicles=active_vehicles,
            maintenance_vehicles=maintenance_vehicles,
            inactive_vehicles=inactive_vehicles,
            utilization_percentage=round(util_pct, 2)
        )

    def get_shipments(self):
        from app.schemas.analytics import ShipmentAnalyticsResponse
        pending = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.CREATED).count()
        assigned = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.ASSIGNED).count()
        picked_up = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.PICKED_UP).count()
        in_transit = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.IN_TRANSIT).count()
        out_for_delivery = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.OUT_FOR_DELIVERY).count()
        delivered = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELIVERED).count()
        cancelled = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.CANCELLED).count()
        delayed = self.db.query(Shipment).filter(Shipment.current_status == ShipmentStatus.DELAYED).count()

        return ShipmentAnalyticsResponse(
            pending=pending,
            assigned=assigned,
            picked_up=picked_up,
            in_transit=in_transit,
            out_for_delivery=out_for_delivery,
            delivered=delivered,
            cancelled=cancelled,
            delayed=delayed
        )

    def get_trips(self):
        from app.schemas.analytics import TripAnalyticsResponse
        total_trips = self.db.query(Trip).count()
        completed = self.db.query(Trip).filter(Trip.trip_status == TripStatus.COMPLETED).count()
        active = self.db.query(Trip).filter(Trip.trip_status.in_([TripStatus.CREATED, TripStatus.IN_TRANSIT])).count()
        cancelled = self.db.query(Trip).filter(Trip.trip_status == TripStatus.CANCELLED).count()
        
        comp_rate = (completed / total_trips * 100.0) if total_trips > 0 else 0.0

        return TripAnalyticsResponse(
            total_trips=total_trips,
            completed=completed,
            active=active,
            cancelled=cancelled,
            completion_rate=round(comp_rate, 2)
        )
