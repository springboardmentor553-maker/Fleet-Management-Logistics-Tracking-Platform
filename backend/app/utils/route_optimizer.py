def optimize_route(start, destination, traffic="Medium"):
    """
    Simulates route optimization with traffic conditions.
    """

    routes = [
        {
            "route": "NH75",
            "distance_km": 352,
            "base_time_hours": 6.5
        },
        {
            "route": "NH66",
            "distance_km": 365,
            "base_time_hours": 7
        },
        {
            "route": "State Highway",
            "distance_km": 390,
            "base_time_hours": 8
        }
    ]

    best_route = min(routes, key=lambda r: r["distance_km"])

    traffic_factor = {
        "Low": 1.0,
        "Medium": 1.2,
        "High": 1.5
    }

    factor = traffic_factor.get(traffic, 1.2)

    estimated_time = round(best_route["base_time_hours"] * factor, 2)

    if traffic == "Low":
        message = "Roads are clear."
    elif traffic == "Medium":
        message = "Moderate traffic detected."
    else:
        message = "Heavy traffic detected. Delay expected."

    return {
        "source": start,
        "destination": destination,
        "traffic_condition": traffic,
        "recommended_route": best_route["route"],
        "distance_km": best_route["distance_km"],
        "estimated_time_hours": estimated_time,
        "message": message
    }