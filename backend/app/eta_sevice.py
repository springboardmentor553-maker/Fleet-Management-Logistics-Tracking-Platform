from datetime import datetime, timedelta


def calculate_eta(distance_km: float, duration_minutes: float):
    """
    Calculate ETA based on travel duration.
    """

    eta = datetime.now() + timedelta(minutes=duration_minutes)

    return {
        "distance_km": round(distance_km, 2),
        "duration_minutes": round(duration_minutes, 2),
        "estimated_arrival_time": eta.strftime("%d-%m-%Y %I:%M %p")
    }