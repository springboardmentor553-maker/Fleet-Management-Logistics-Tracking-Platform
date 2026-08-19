from datetime import datetime, timedelta

def calculate_eta(duration_minutes):
    """
    Calculates ETA based on travel duration.
    """

    eta = datetime.now() + timedelta(minutes=duration_minutes)

    return eta.strftime("%d-%m-%Y %I:%M %p")