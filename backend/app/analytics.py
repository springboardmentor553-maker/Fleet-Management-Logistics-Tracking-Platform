from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.dependencies import (
    get_db,
    require_role,
)

from app.models.user import User
from app.models.fuel_record import FuelRecord
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.shipment import Shipment

from app.schemas.analytics import (
    FuelAnalyticsResponse,
    OperationsAnalyticsResponse,
)

router = APIRouter()


# ---------------------------------
# Fuel Analytics
# ---------------------------------
@router.get(
    "/fuel",
    response_model=FuelAnalyticsResponse
)
def fuel_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher"
        )
    ),
):

    total_fuel = db.query(
        func.sum(FuelRecord.fuel_quantity)
    ).scalar() or 0

    total_cost = db.query(
        func.sum(FuelRecord.fuel_cost)
    ).scalar() or 0

    average_fuel = db.query(
        func.avg(FuelRecord.fuel_quantity)
    ).scalar() or 0

    highest = (
        db.query(
            Vehicle.vehicle_number,
            func.sum(FuelRecord.fuel_quantity).label("fuel")
        )
        .join(
            FuelRecord,
            FuelRecord.vehicle_id == Vehicle.id
        )
        .group_by(Vehicle.vehicle_number)
        .order_by(
            func.sum(FuelRecord.fuel_quantity).desc()
        )
        .first()
    )

    lowest = (
        db.query(
            Vehicle.vehicle_number,
            func.sum(FuelRecord.fuel_quantity).label("fuel")
        )
        .join(
            FuelRecord,
            FuelRecord.vehicle_id == Vehicle.id
        )
        .group_by(Vehicle.vehicle_number)
        .order_by(
            func.sum(FuelRecord.fuel_quantity)
        )
        .first()
    )

    return {
        "totalFuelConsumed": round(total_fuel, 2),
        "totalFuelCost": round(total_cost, 2),
        "averageFuelConsumption": round(
            average_fuel,
            2
        ),
        "highestFuelUsageVehicle":
            highest.vehicle_number if highest else "N/A",
        "lowestFuelUsageVehicle":
            lowest.vehicle_number if lowest else "N/A",
    }

# ---------------------------------
# Operational Analytics
# ---------------------------------
@router.get(
    "/operations",
    response_model=OperationsAnalyticsResponse
)
def operations_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "admin",
            "fleet manager",
            "dispatcher"
        )
    ),
):
    shipments = db.query(Shipment).all()
    trips = db.query(Trip).all()

    total_deliveries = len(shipments)

    successful = sum(
        s.status.value.lower() == "delivered"
        for s in shipments
    )

    delayed = sum(
        s.status.value.lower() == "delayed"
        for s in shipments
    )

    cancelled = sum(
        s.status.value.lower() == "cancelled"
        for s in shipments
    )

    average_distance = db.query(
        func.avg(Trip.distance)
    ).scalar() or 0

    completed_trips = [
        t for t in trips
        if t.end_time is not None
    ]

    if completed_trips:
        total_seconds = sum(
            (
                t.end_time - t.start_time
            ).total_seconds()
            for t in completed_trips
        )

        avg_hours = (
            total_seconds / len(completed_trips)
        ) / 3600
    else:
        avg_hours = 0

    return {
        "totalDeliveries": total_deliveries,
        "successfulDeliveries": successful,
        "delayedDeliveries": delayed,
        "cancelledDeliveries": cancelled,
        "averageTripDistance": round(
            average_distance,
            2
        ),
        "averageDeliveryTime": round(
            avg_hours,
            2
        ),
    }