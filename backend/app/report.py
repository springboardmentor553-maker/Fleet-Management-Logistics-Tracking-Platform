from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies import (
    get_db,
    require_role,
)

from app.models.user import User
from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.models.fuel_record import FuelRecord
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.shipment import Shipment

from app.enums import ShipmentStatus

from app.schemas.report import (
    MaintenanceReportResponse,
    FleetUtilizationReportResponse,
    FuelConsumptionReportResponse,
    DriverPerformanceReportResponse,
    DeliveryPerformanceReportResponse,
    FuelVehicleReport,
    DriverPerformanceReport,
)

router = APIRouter()


# ============================================================
# COMMON REPORT ROLES
# ============================================================

REPORT_ROLES = (
    "admin",
    "fleet manager",
    "dispatcher",
)


# ============================================================
# MAINTENANCE REPORT
# ============================================================

@router.get(
    "/maintenance",
    response_model=MaintenanceReportResponse
)
def maintenance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*REPORT_ROLES)
    ),
):

    total_records = db.query(
        Maintenance
    ).count()

    vehicles_under_maintenance = db.query(
        Vehicle
    ).filter(
        func.lower(Vehicle.status) == "maintenance"
    ).count()

    completed_services = db.query(
        Maintenance
    ).filter(
        func.lower(
            Maintenance.maintenance_status
        ) == "completed"
    ).count()

    overdue_services = db.query(
        Maintenance
    ).filter(
        Maintenance.next_service_date < datetime.utcnow()
    ).count()

    total_cost = db.query(
        func.sum(Maintenance.service_cost)
    ).scalar() or 0

    frequent = (
        db.query(
            Maintenance.maintenance_category,
            func.count(
                Maintenance.id
            ).label("count")
        )
        .group_by(
            Maintenance.maintenance_category
        )
        .order_by(
            func.count(
                Maintenance.id
            ).desc()
        )
        .first()
    )

    return {
        "totalMaintenanceRecords": total_records,
        "vehiclesUnderMaintenance":
            vehicles_under_maintenance,
        "completedServices":
            completed_services,
        "overdueServices":
            overdue_services,
        "totalMaintenanceCost":
            round(float(total_cost), 2),
        "mostFrequentMaintenanceCategory":
            frequent.maintenance_category
            if frequent
            else "N/A",
    }


# ============================================================
# FLEET UTILIZATION REPORT
# ============================================================

@router.get(
    "/fleet-utilization",
    response_model=FleetUtilizationReportResponse
)
def fleet_utilization_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*REPORT_ROLES)
    ),
):

    vehicles = db.query(Vehicle).all()

    total = len(vehicles)

    available = sum(
        str(vehicle.status).lower() == "available"
        for vehicle in vehicles
    )

    on_trip = sum(
        str(vehicle.status).lower()
        in ["on trip", "on_trip", "ontrip"]
        for vehicle in vehicles
    )

    maintenance = sum(
        str(vehicle.status).lower()
        == "maintenance"
        for vehicle in vehicles
    )

    inactive = sum(
        str(vehicle.status).lower()
        == "inactive"
        for vehicle in vehicles
    )

    utilization_rate = (
        (on_trip / total) * 100
        if total > 0
        else 0
    )

    return {
        "totalVehicles": total,
        "availableVehicles": available,
        "vehiclesOnTrip": on_trip,
        "vehiclesUnderMaintenance": maintenance,
        "inactiveVehicles": inactive,
        "utilizationRate":
            round(utilization_rate, 2),
    }


# ============================================================
# FUEL CONSUMPTION REPORT
# ============================================================

@router.get(
    "/fuel-consumption",
    response_model=FuelConsumptionReportResponse
)
def fuel_consumption_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*REPORT_ROLES)
    ),
):

    records = db.query(
        FuelRecord
    ).all()

    total_records = len(records)

    total_quantity = sum(
        float(record.fuel_quantity or 0)
        for record in records
    )

    total_cost = sum(
        float(record.fuel_cost or 0)
        for record in records
    )

    average_cost = (
        total_cost / total_quantity
        if total_quantity > 0
        else 0
    )

    vehicle_rows = (
        db.query(
            FuelRecord.vehicle_id,
            func.sum(
                FuelRecord.fuel_quantity
            ).label("fuel_quantity"),
            func.sum(
                FuelRecord.fuel_cost
            ).label("fuel_cost"),
        )
        .group_by(
            FuelRecord.vehicle_id
        )
        .order_by(
            func.sum(
                FuelRecord.fuel_cost
            ).desc()
        )
        .all()
    )

    vehicle_breakdown = []

    for row in vehicle_rows:
        vehicle_breakdown.append(
            FuelVehicleReport(
                vehicleId=row.vehicle_id,
                fuelQuantity=round(
                    float(row.fuel_quantity or 0),
                    2
                ),
                fuelCost=round(
                    float(row.fuel_cost or 0),
                    2
                ),
            )
        )

    return {
        "totalFuelRecords": total_records,
        "totalFuelQuantity":
            round(total_quantity, 2),
        "totalFuelCost":
            round(total_cost, 2),
        "averageFuelCost":
            round(average_cost, 2),
        "vehicleBreakdown":
            vehicle_breakdown,
    }


# ============================================================
# DRIVER PERFORMANCE REPORT
# ============================================================

@router.get(
    "/driver-performance",
    response_model=DriverPerformanceReportResponse
)
def driver_performance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*REPORT_ROLES)
    ),
):

    drivers = db.query(
        Driver
    ).all()

    driver_reports = []

    total_trips = 0
    completed_trips = 0
    active_trips = 0
    cancelled_trips = 0

    best_driver = "N/A"
    best_completed = -1

    for driver in drivers:

        trips = db.query(
            Trip
        ).filter(
            Trip.driver_id == driver.id
        ).all()

        driver_total = len(trips)

        driver_completed = sum(
            str(trip.status).upper()
            == "COMPLETED"
            for trip in trips
        )

        driver_active = sum(
            str(trip.status).upper()
            in ["ONGOING", "IN_PROGRESS"]
            for trip in trips
        )

        driver_cancelled = sum(
            str(trip.status).upper()
            == "CANCELLED"
            for trip in trips
        )

        total_trips += driver_total
        completed_trips += driver_completed
        active_trips += driver_active
        cancelled_trips += driver_cancelled

        if driver_completed > best_completed:
            best_completed = driver_completed
            best_driver = driver.name

        driver_reports.append(
            DriverPerformanceReport(
                driverId=driver.id,
                driverName=driver.name,
                totalTrips=driver_total,
                completedTrips=driver_completed,
                activeTrips=driver_active,
                cancelledTrips=driver_cancelled,
            )
        )

    driver_reports.sort(
        key=lambda driver:
            driver.completedTrips,
        reverse=True
    )

    return {
        "totalDrivers": len(drivers),
        "totalTrips": total_trips,
        "completedTrips": completed_trips,
        "activeTrips": active_trips,
        "cancelledTrips": cancelled_trips,
        "bestPerformingDriver":
            best_driver,
        "drivers":
            driver_reports,
    }


# ============================================================
# DELIVERY PERFORMANCE REPORT
# ============================================================

@router.get(
    "/delivery-performance",
    response_model=DeliveryPerformanceReportResponse
)
def delivery_performance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*REPORT_ROLES)
    ),
):

    shipments = db.query(
        Shipment
    ).all()

    total = len(shipments)

    delivered = sum(
        shipment.status
        == ShipmentStatus.DELIVERED
        for shipment in shipments
    )

    in_transit = sum(
        shipment.status
        in [
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY,
            ShipmentStatus.PICKED_UP,
        ]
        for shipment in shipments
    )

    delayed = sum(
        shipment.status
        == ShipmentStatus.DELAYED
        for shipment in shipments
    )

    cancelled = sum(
        shipment.status
        == ShipmentStatus.CANCELLED
        for shipment in shipments
    )

    pending = sum(
        shipment.status
        in [
            ShipmentStatus.CREATED,
            ShipmentStatus.ASSIGNED,
        ]
        for shipment in shipments
    )

    completion_rate = (
        (delivered / total) * 100
        if total > 0
        else 0
    )

    return {
        "totalShipments": total,
        "deliveredShipments": delivered,
        "inTransitShipments": in_transit,
        "delayedShipments": delayed,
        "cancelledShipments": cancelled,
        "pendingShipments": pending,
        "deliveryCompletionRate":
            round(completion_rate, 2),
    }