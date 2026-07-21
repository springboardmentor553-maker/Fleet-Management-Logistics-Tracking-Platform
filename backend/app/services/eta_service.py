import math


def calculate_eta(
    current_lat,
    current_lon,
    dest_lat,
    dest_lon,
    average_speed=40
):
    """
    Simple ETA calculator.
    Average speed = 40 km/h
    """

    distance = math.sqrt(
        (dest_lat - current_lat) ** 2 +
        (dest_lon - current_lon) ** 2
    )

    eta_hours = distance / average_speed

    hours = int(eta_hours)
    minutes = int((eta_hours - hours) * 60)

    if hours == 0:
        return f"{minutes} minutes"

    return f"{hours} hours {minutes} minutes"