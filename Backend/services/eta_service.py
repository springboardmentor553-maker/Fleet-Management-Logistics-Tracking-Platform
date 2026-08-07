from datetime import datetime, timedelta


def calculate_eta(duration_seconds: float):
    """
    Calculate the estimated arrival time.

    Args:
        duration_seconds (float): Route duration in seconds.

    Returns:
        dict: ETA information.
    """

    now = datetime.now()

    eta = now + timedelta(seconds=duration_seconds)

    return {
        "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "estimated_arrival": eta.strftime("%Y-%m-%d %H:%M:%S"),
        "travel_duration_minutes": round(duration_seconds / 60, 2)
    }