from datetime import datetime, timedelta


def calculate_eta(duration_min: float, start_time: datetime = None):
    """
    Calculates the estimated arrival time given a travel duration in minutes.
    If no start_time is provided, assumes the trip starts now (UTC).
    Kept as a separate service since ETA logic may grow more advanced later
    (e.g. accounting for rest stops, traffic patterns, or driver schedules).
    """
    if start_time is None:
        start_time = datetime.utcnow()

    eta_datetime = start_time + timedelta(minutes=duration_min)

    return {
        "eta_datetime": eta_datetime,
        "eta_readable": eta_datetime.strftime("%d %b %Y, %I:%M %p"),
    }