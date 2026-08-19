import requests


def get_route(
    pickup_lat,
    pickup_lon,
    destination_lat,
    destination_lon
):
    try:

        url = (
            f"https://router.project-osrm.org/route/v1/driving/"
            f"{pickup_lon},{pickup_lat};"
            f"{destination_lon},{destination_lat}"
            f"?overview=full&geometries=geojson"
        )

        response = requests.get(url, timeout=15)

        if response.status_code != 200:
            print("OSRM Error:", response.text)
            return None

        data = response.json()

        if data.get("code") != "Ok":
            print("OSRM Route Error:", data)
            return None

        route = data["routes"][0]

        # OSRM returns [longitude, latitude]
        coordinates = route["geometry"]["coordinates"]

        # Convert to [latitude, longitude]
        route_coordinates = [
            [point[1], point[0]]
            for point in coordinates
        ]

        return {
            "distance_km": round(
                route["distance"] / 1000,
                2
            ),

            "estimated_duration_minutes": round(
                route["duration"] / 60,
                2
            ),

            "route_coordinates": route_coordinates
        }

    except Exception as e:

        print("Route Service Error:", e)

        return None