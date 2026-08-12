from datetime import datetime, timedelta


def calculate_eta(
    distance_km: float,
    duration_minutes: float,
):
    """
    Calculate ETA using the remaining road duration.

    distance_km:
        Remaining road distance from vehicle
        current location to destination.

    duration_minutes:
        Remaining road travel time returned by OSRM.
    """

    if distance_km < 0:
        raise ValueError(
            "Distance cannot be negative."
        )

    if duration_minutes < 0:
        raise ValueError(
            "Duration cannot be negative."
        )

    estimated_arrival = (
        datetime.now()
        + timedelta(
            minutes=duration_minutes
        )
    )

    return {
        "distance_km": round(
            distance_km,
            2,
        ),

        "duration_minutes": round(
            duration_minutes,
            2,
        ),

        "estimated_arrival_time":
            estimated_arrival.strftime(
                "%d-%m-%Y %I:%M %p"
            ),
    }