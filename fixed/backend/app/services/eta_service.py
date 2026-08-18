from datetime import datetime, timedelta, timezone


def calculate_eta(
    duration_seconds: float | None,
    distance_meters: float | None = None,
    start_time: datetime | None = None,
    average_speed_kmh: float = 50.0,
) -> dict:
    """Calculate Estimated Time of Arrival (ETA) based on travel duration or distance.
    Returns structured data containing estimated arrival timestamp and readable format.
    """
    base_time = start_time if start_time else datetime.now(timezone.utc)

    if duration_seconds is not None and duration_seconds > 0:
        travel_duration = timedelta(seconds=duration_seconds)
    elif distance_meters is not None and distance_meters > 0:
        duration_hours = (distance_meters / 1000.0) / average_speed_kmh
        travel_duration = timedelta(hours=duration_hours)
    else:
        travel_duration = timedelta(hours=1)  # Default fallback 1 hour

    eta_datetime = base_time + travel_duration

    # Format readable string, e.g. "Jul 27, 2026 at 21:45 UTC"
    readable_eta = eta_datetime.strftime("%b %d, %Y at %H:%M %Z").strip()

    return {
        "estimated_arrival_time": eta_datetime,
        "eta_formatted": readable_eta,
        "duration_seconds": int(travel_duration.total_seconds()),
        "duration_hours": round(travel_duration.total_seconds() / 3600.0, 2),
    }
