import os
import time
from typing import Dict

import requests


# ==========================================================
# GEOCODING CONFIGURATION
# ==========================================================

# IMPORTANT:
#
# Do NOT use the public Nominatim server for FleetFlow's
# automatic vehicle/fleet tracking.
#
# Configure this with your own Nominatim server or another
# permitted OSM-based geocoding provider.
#
# Example .env:
#
# GEOCODING_URL=http://localhost:8080/search
#
# or:
#
# GEOCODING_URL=https://your-server.example.com/search
#
# ==========================================================

GEOCODING_URL = os.getenv(
    "GEOCODING_URL"
)


# ==========================================================
# USER AGENT
# ==========================================================

USER_AGENT = os.getenv(
    "GEOCODING_USER_AGENT",
    "FleetFlow/1.0"
)


# ==========================================================
# REQUEST TIMEOUT
# ==========================================================

GEOCODING_TIMEOUT = int(
    os.getenv(
        "GEOCODING_TIMEOUT",
        "20"
    )
)


# ==========================================================
# REQUEST DELAY
# ==========================================================

MIN_REQUEST_INTERVAL = float(
    os.getenv(
        "GEOCODING_MIN_INTERVAL",
        "1.0"
    )
)


_last_request_time = 0.0


# ==========================================================
# INTERNAL REQUEST LIMITER
# ==========================================================

def _wait_before_request():

    global _last_request_time

    current_time = time.monotonic()

    elapsed = (
        current_time
        - _last_request_time
    )

    if elapsed < MIN_REQUEST_INTERVAL:

        time.sleep(
            MIN_REQUEST_INTERVAL
            - elapsed
        )

    _last_request_time = (
        time.monotonic()
    )


# ==========================================================
# GET COORDINATES
# ==========================================================

def get_coordinates(
    location: str,
) -> Dict[str, float]:

    # ------------------------------------------------------
    # Validate location
    # ------------------------------------------------------

    if not location:

        raise ValueError(
            "Location is required."
        )

    location = location.strip()

    if not location:

        raise ValueError(
            "Location cannot be empty."
        )


    # ------------------------------------------------------
    # Validate geocoder configuration
    # ------------------------------------------------------

    if not GEOCODING_URL:

        raise ValueError(

            "Geocoding service is not configured. "
            "Set GEOCODING_URL in the backend .env file."

        )


    # ------------------------------------------------------
    # Wait between requests
    # ------------------------------------------------------

    _wait_before_request()


    # ------------------------------------------------------
    # Headers
    # ------------------------------------------------------

    headers = {

        "User-Agent":
            USER_AGENT,

        "Accept":
            "application/json",

    }


    # ------------------------------------------------------
    # Query parameters
    # ------------------------------------------------------

    params = {

        "q":
            location,

        "format":
            "jsonv2",

        "limit":
            1,

    }


    # ------------------------------------------------------
    # Request
    # ------------------------------------------------------

    try:

        response = requests.get(

            GEOCODING_URL,

            params=params,

            headers=headers,

            timeout=GEOCODING_TIMEOUT,

        )

    except requests.Timeout:

        raise ValueError(

            "Geocoding service timed out."

        )

    except requests.ConnectionError:

        raise ValueError(

            "Could not connect to the geocoding service."

        )

    except requests.RequestException as exc:

        raise ValueError(

            f"Geocoding request failed: {exc}"

        )


    # ------------------------------------------------------
    # HTTP ERROR
    # ------------------------------------------------------

    if response.status_code != 200:

        if response.status_code == 403:

            raise ValueError(

                "Geocoding service rejected the request "
                "(HTTP 403). Check the configured "
                "OSM-based geocoding provider and its "
                "usage policy."

            )

        if response.status_code == 429:

            raise ValueError(

                "Geocoding service rate limit exceeded. "
                "Please wait before trying again."

            )

        raise ValueError(

            "Geocoding service returned "
            f"HTTP {response.status_code}."

        )


    # ------------------------------------------------------
    # Parse JSON
    # ------------------------------------------------------

    try:

        results = response.json()

    except ValueError:

        raise ValueError(

            "Geocoding service returned invalid JSON."

        )


    # ------------------------------------------------------
    # Check results
    # ------------------------------------------------------

    if not isinstance(
        results,
        list
    ):

        raise ValueError(

            "Unexpected response from "
            "geocoding service."

        )


    if len(results) == 0:

        raise ValueError(

            f"No coordinates found for "
            f"'{location}'."

        )


    # ------------------------------------------------------
    # First result
    # ------------------------------------------------------

    result = results[0]


    # ------------------------------------------------------
    # Validate latitude
    # ------------------------------------------------------

    if "lat" not in result:

        raise ValueError(

            "Geocoding response does not "
            "contain latitude."

        )


    # ------------------------------------------------------
    # Validate longitude
    # ------------------------------------------------------

    if "lon" not in result:

        raise ValueError(

            "Geocoding response does not "
            "contain longitude."

        )


    # ------------------------------------------------------
    # Convert coordinates
    # ------------------------------------------------------

    try:

        latitude = float(
            result["lat"]
        )

        longitude = float(
            result["lon"]
        )

    except (
        TypeError,
        ValueError,
    ):

        raise ValueError(

            "Geocoding service returned "
            "invalid latitude/longitude."

        )


    # ------------------------------------------------------
    # Validate coordinate ranges
    # ------------------------------------------------------

    if not (
        -90 <= latitude <= 90
    ):

        raise ValueError(

            "Invalid latitude returned "
            "by geocoding service."

        )


    if not (
        -180 <= longitude <= 180
    ):

        raise ValueError(

            "Invalid longitude returned "
            "by geocoding service."

        )


    # ------------------------------------------------------
    # Return coordinates
    # ------------------------------------------------------

    return {

        "latitude":
            latitude,

        "longitude":
            longitude,

    }