from datetime import datetime, timedelta


def calculate_eta(duration_seconds: int):
    """
    Calculate the Estimated Time of Arrival (ETA)
    using route duration in seconds.
    """

    eta = datetime.utcnow() + timedelta(seconds=duration_seconds)

    return {
        "estimated_arrival_time": eta.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "estimated_travel_duration": str(
            timedelta(seconds=duration_seconds)
        )
    }