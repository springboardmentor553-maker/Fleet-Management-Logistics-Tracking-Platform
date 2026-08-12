from datetime import datetime, timedelta


def calculate_eta(duration_minutes: float):
    eta = datetime.now() + timedelta(minutes=duration_minutes)

    return eta