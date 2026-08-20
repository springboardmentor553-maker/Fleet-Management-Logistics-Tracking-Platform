from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.fuel_record import FuelRecord
from app.models.vehicle import Vehicle


# ==========================================================
# ALERT THRESHOLDS
# ==========================================================

HIGH_CONSUMPTION_THRESHOLD = 15.0

LOW_MILEAGE_THRESHOLD = 6.0


# ==========================================================
# ROUND VALUE
# ==========================================================

def round_value(
    value,
    digits=2,
):

    return round(
        float(value or 0),
        digits,
    )


# ==========================================================
# CREATE
# ==========================================================

def create_fuel_record(
    db: Session,
    data,
):

    fuel_record = FuelRecord(

        vehicle_id=data.vehicle_id,

        trip_id=data.trip_id,

        fuel_consumed_liters=(
            data.fuel_consumed_liters
        ),

        distance_km=(
            data.distance_km
        ),

        odometer_km=(
            data.odometer_km
        ),

        fuel_type=(
            data.fuel_type
        ),

        notes=(
            data.notes
        ),
    )

    db.add(
        fuel_record
    )

    db.commit()

    db.refresh(
        fuel_record
    )

    return fuel_record


# ==========================================================
# GET ALL
# ==========================================================

def get_fuel_records(
    db: Session,
):

    return (
        db.query(FuelRecord)
        .order_by(
            FuelRecord.id.desc()
        )
        .all()
    )


# ==========================================================
# GET ONE
# ==========================================================

def get_fuel_record(
    db: Session,
    record_id: int,
):

    return (
        db.query(FuelRecord)
        .filter(
            FuelRecord.id == record_id
        )
        .first()
    )


# ==========================================================
# UPDATE
# ==========================================================

def update_fuel_record(
    db: Session,
    fuel_record: FuelRecord,
    data,
):

    values = data.model_dump(
        exclude_unset=True
    )

    for key, value in values.items():

        setattr(
            fuel_record,
            key,
            value,
        )

    db.commit()

    db.refresh(
        fuel_record
    )

    return fuel_record


# ==========================================================
# DELETE
# ==========================================================

def delete_fuel_record(
    db: Session,
    fuel_record: FuelRecord,
):

    db.delete(
        fuel_record
    )

    db.commit()


# ==========================================================
# SUMMARY
# ==========================================================

def get_fuel_summary(
    db: Session,
):

    result = (
        db.query(

            func.coalesce(
                func.sum(
                    FuelRecord.fuel_consumed_liters
                ),
                0,
            ).label(
                "total_fuel"
            ),

            func.coalesce(
                func.sum(
                    FuelRecord.distance_km
                ),
                0,
            ).label(
                "total_distance"
            ),

            func.count(
                FuelRecord.id
            ).label(
                "total_records"
            ),

        )
        .first()
    )

    total_fuel = float(
        result.total_fuel or 0
    )

    total_distance = float(
        result.total_distance or 0
    )

    total_records = int(
        result.total_records or 0
    )


    if (
        total_distance > 0
        and total_fuel > 0
    ):

        average_consumption = (
            total_fuel
            / total_distance
        ) * 100

        average_mileage = (
            total_distance
            / total_fuel
        )

    else:

        average_consumption = 0

        average_mileage = 0


    return {

        "total_fuel_consumed":
            round_value(
                total_fuel
            ),

        "average_consumption":
            round_value(
                average_consumption
            ),

        "total_distance":
            round_value(
                total_distance
            ),

        "average_mileage":
            round_value(
                average_mileage
            ),

        "total_records":
            total_records,
    }


# ==========================================================
# VEHICLE PERFORMANCE
# ==========================================================

def get_vehicle_performance(
    db: Session,
):

    rows = (
        db.query(

            Vehicle.id,

            Vehicle.vehicle_number,

            Vehicle.registration_number,

            Vehicle.fuel_type,

            func.coalesce(
                func.sum(
                    FuelRecord.fuel_consumed_liters
                ),
                0,
            ).label(
                "total_fuel"
            ),

            func.coalesce(
                func.sum(
                    FuelRecord.distance_km
                ),
                0,
            ).label(
                "total_distance"
            ),

        )
        .outerjoin(
            FuelRecord,
            Vehicle.id
            == FuelRecord.vehicle_id,
        )
        .group_by(

            Vehicle.id,

            Vehicle.vehicle_number,

            Vehicle.registration_number,

            Vehicle.fuel_type,

        )
        .order_by(
            Vehicle.id.asc()
        )
        .all()
    )


    results = []


    for row in rows:

        total_fuel = float(
            row.total_fuel or 0
        )

        total_distance = float(
            row.total_distance or 0
        )


        if (
            total_distance > 0
            and total_fuel > 0
        ):

            consumption = (
                total_fuel
                / total_distance
            ) * 100

            mileage = (
                total_distance
                / total_fuel
            )

        else:

            consumption = 0

            mileage = 0


        results.append({

            "vehicle_id":
                row.id,

            "vehicle_number":
                row.vehicle_number,

            "registration_number":
                row.registration_number,

            "fuel_type":
                row.fuel_type,

            "total_fuel_consumed":
                round_value(
                    total_fuel
                ),

            "total_distance":
                round_value(
                    total_distance
                ),

            "average_consumption":
                round_value(
                    consumption
                ),

            "average_mileage":
                round_value(
                    mileage
                ),

        })


    return results


# ==========================================================
# ALERTS
# ==========================================================

def get_fuel_alerts(
    db: Session,
):

    performance = (
        get_vehicle_performance(
            db
        )
    )

    alerts = []


    for vehicle in performance:

        consumption = float(
            vehicle[
                "average_consumption"
            ]
            or 0
        )

        mileage = float(
            vehicle[
                "average_mileage"
            ]
            or 0
        )


        if (
            consumption
            >= HIGH_CONSUMPTION_THRESHOLD
        ):

            alerts.append({

                "vehicle_id":
                    vehicle[
                        "vehicle_id"
                    ],

                "vehicle_number":
                    vehicle[
                        "vehicle_number"
                    ],

                "registration_number":
                    vehicle[
                        "registration_number"
                    ],

                "average_consumption":
                    consumption,

                "average_mileage":
                    mileage,

                "alert_type":
                    "HIGH_CONSUMPTION",

                "message":
                    "Vehicle has high fuel consumption.",

            })

            continue


        if (
            mileage > 0
            and mileage
            <= LOW_MILEAGE_THRESHOLD
        ):

            alerts.append({

                "vehicle_id":
                    vehicle[
                        "vehicle_id"
                    ],

                "vehicle_number":
                    vehicle[
                        "vehicle_number"
                    ],

                "registration_number":
                    vehicle[
                        "registration_number"
                    ],

                "average_consumption":
                    consumption,

                "average_mileage":
                    mileage,

                "alert_type":
                    "LOW_MILEAGE",

                "message":
                    "Vehicle has low fuel efficiency.",

            })


    return alerts


# ==========================================================
# COMPLETE DATA
# ==========================================================

def get_fuel_monitoring_data(
    db: Session,
):

    return {

        "summary":
            get_fuel_summary(
                db
            ),

        "vehicle_performance":
            get_vehicle_performance(
                db
            ),

        "alerts":
            get_fuel_alerts(
                db
            ),

    }