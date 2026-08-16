"""ETA Calculation Service.

Calculates the Estimated Time of Arrival for a trip based on the route
data returned by the OSRM Directions service.

Kept as a dedicated module because ETA logic will grow over time:
  - Traffic multipliers
  - Driver rest-stop buffers
  - Time-of-day speed adjustments
  - Historical delay statistics

Public API
----------
calculate_eta(departure_time, duration_seconds) -> ETAResult
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass
class ETAResult:
    """Structured ETA result returned by calculate_eta()."""

    departure_time: datetime       # When the trip is scheduled to start
    duration_seconds: int          # Raw travel time from the routing engine
    estimated_arrival: datetime    # Computed ETA = departure + duration
    duration_text: str             # Human-readable duration, e.g. "16 hr 53 min"
    arrival_text: str              # Human-readable ETA, e.g. "25 Jul 2026 11:30 IST"
    distance_text: str             # Human-readable distance, e.g. "1,378.7 km"
    distance_meters: int           # Raw distance in metres


def _format_duration(seconds: int) -> str:
    """Convert total seconds to a human-readable string."""
    hours, remainder = divmod(seconds, 3600)
    minutes = remainder // 60
    if hours > 0:
        return f"{hours} hr {minutes} min"
    return f"{minutes} min"


def _format_arrival(dt: datetime) -> str:
    """Format a datetime as a human-readable arrival string."""
    return dt.strftime("%-d %b %Y %H:%M UTC")


def calculate_eta(
    departure_time: datetime,
    duration_seconds: int,
    distance_meters: int = 0,
    distance_text: str = "",
) -> ETAResult:
    """Compute ETA from a scheduled departure time and OSRM routing data.

    Args:
        departure_time:   Scheduled start time of the trip (timezone-aware or naive).
        duration_seconds: Total driving time in seconds from the routing engine.
        distance_meters:  Total route distance in metres (for display).
        distance_text:    Pre-formatted distance string (e.g. "1,378.7 km").

    Returns:
        ETAResult dataclass with arrival time and formatted strings.
    """
    # Normalise to UTC-naive for arithmetic (DB stores naive datetimes)
    if departure_time.tzinfo is not None:
        departure_naive = departure_time.astimezone(timezone.utc).replace(tzinfo=None)
    else:
        departure_naive = departure_time

    delta = timedelta(seconds=duration_seconds)
    estimated_arrival = departure_naive + delta

    return ETAResult(
        departure_time=departure_naive,
        duration_seconds=duration_seconds,
        estimated_arrival=estimated_arrival,
        duration_text=_format_duration(duration_seconds),
        arrival_text=_format_arrival(estimated_arrival),
        distance_text=distance_text,
        distance_meters=distance_meters,
    )
