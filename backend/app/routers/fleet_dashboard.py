from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db

from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.shipment import Shipment
from app.models.maintenance import Maintenance
from app.models.fuel import Fuel

router = APIRouter(
    prefix="/fleet-dashboard",
    tags=["Fleet Dashboard"]
)


@router.get("/")
def fleet_dashboard(db: Session = Depends(get_db)):

    # =====================================================
    # VEHICLES
    # =====================================================

    total_vehicles = db.query(Vehicle).count()

    available_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    maintenance_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Maintenance"
    ).count()

    in_transit_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "In Transit"
    ).count()

    # =====================================================
    # DRIVERS
    # =====================================================

    total_drivers = db.query(Driver).count()

    available_drivers = db.query(Driver).filter(
        Driver.status == "Available"
    ).count()

    assigned_drivers = db.query(Driver).filter(
        Driver.status == "Assigned"
    ).count()

    # =====================================================
    # TRIPS
    # =====================================================

    total_trips = db.query(Trip).count()

    created_trips = db.query(Trip).filter(
        Trip.status == "Created"
    ).count()

    assigned_trips = db.query(Trip).filter(
        Trip.status == "Assigned"
    ).count()

    picked_up_trips = db.query(Trip).filter(
        Trip.status == "Picked Up"
    ).count()

    in_transit_trips = db.query(Trip).filter(
        Trip.status == "In Transit"
    ).count()

    completed_trips = db.query(Trip).filter(
        Trip.status == "Delivered"
    ).count()

    cancelled_trips = db.query(Trip).filter(
        Trip.status == "Cancelled"
    ).count()

    # =====================================================
    # SHIPMENTS
    # =====================================================

    total_shipments = db.query(Shipment).count()

    delivered_trip_shipment_ids = db.query(Trip.shipment_id).filter(
        func.lower(func.trim(Trip.status)) == "delivered"
    )

    pending_shipments = db.query(Shipment).filter(
        func.lower(func.trim(Shipment.status)) == "pending",
        Shipment.id.notin_(delivered_trip_shipment_ids)
    ).count()

    shipment_in_transit = db.query(Shipment).filter(
        func.lower(func.trim(Shipment.status)) == "in transit",
        Shipment.id.notin_(delivered_trip_shipment_ids)
    ).count()

    delivered_shipments = db.query(Shipment).filter(
        (func.lower(func.trim(Shipment.status)) == "delivered") |
        Shipment.id.in_(delivered_trip_shipment_ids)
    ).count()


    # =====================================================
    # MAINTENANCE
    # =====================================================

    total_maintenance = db.query(Maintenance).filter(
        Maintenance.is_active == 1
    ).count()

    scheduled_maintenance = db.query(Maintenance).filter(
        Maintenance.status == "Scheduled",
        Maintenance.is_active == 1
    ).count()

    completed_maintenance = db.query(Maintenance).filter(
        Maintenance.status == "Completed",
        Maintenance.is_active == 1
    ).count()

    cancelled_maintenance = db.query(Maintenance).filter(
        Maintenance.status == "Cancelled",
        Maintenance.is_active == 1
    ).count()

    maintenance_cost = db.query(
        func.sum(Maintenance.service_cost)
    ).scalar() or 0

    # =====================================================
    # FUEL
    # =====================================================

    total_fuel_records = db.query(Fuel).count()

    total_liters = db.query(
        func.sum(Fuel.liters)
    ).scalar() or 0

    total_fuel_cost = db.query(
        func.sum(Fuel.cost)
    ).scalar() or 0

    average_bill = db.query(
        func.avg(Fuel.cost)
    ).scalar() or 0

    highest_bill = db.query(
        func.max(Fuel.cost)
    ).scalar() or 0

    lowest_bill = db.query(
        func.min(Fuel.cost)
    ).scalar() or 0

    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "fleet": {
            "total_vehicles": total_vehicles,
            "available_vehicles": available_vehicles,
            "vehicles_in_transit": in_transit_vehicles,
            "vehicles_under_maintenance": maintenance_vehicles
        },

        "drivers": {
            "total_drivers": total_drivers,
            "available_drivers": available_drivers,
            "assigned_drivers": assigned_drivers
        },

        "trips": {
            "total_trips": total_trips,
            "created": created_trips,
            "assigned": assigned_trips,
            "picked_up": picked_up_trips,
            "in_transit": in_transit_trips,
            "completed": completed_trips,
            "cancelled": cancelled_trips
        },

        "shipments": {
            "total_shipments": total_shipments,
            "pending": pending_shipments,
            "in_transit": shipment_in_transit,
            "delivered": delivered_shipments
        },

        "maintenance": {
            "total_records": total_maintenance,
            "scheduled": scheduled_maintenance,
            "completed": completed_maintenance,
            "cancelled": cancelled_maintenance,
            "total_cost": round(maintenance_cost, 2)
        },

        "fuel": {
            "total_records": total_fuel_records,
            "total_liters": round(total_liters, 2),
            "total_cost": round(total_fuel_cost, 2),
            "average_bill": round(average_bill, 2),
            "highest_bill": round(highest_bill, 2),
            "lowest_bill": round(lowest_bill, 2)
        }

    }