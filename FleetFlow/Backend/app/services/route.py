from math import atan2, cos, radians, sin, sqrt
from typing import Optional, Tuple

from app.models.driver import Driver
from app.models.shipment import Shipment
from app.models.vehicle import Vehicle
from app.services import route_service

KNOWN_LOCATIONS = {
    'chennai': (13.0827, 80.2707),
    'mumbai': (19.0760, 72.8777),
    'bangalore': (12.9716, 77.5946),
    'bengaluru': (12.9716, 77.5946),
    'delhi': (28.7041, 77.1025),
    'kolkata': (22.5726, 88.3639),
    'hyderabad': (17.3850, 78.4867),
    'pune': (18.5204, 73.8567),
    'ahmedabad': (23.0225, 72.5714),
    'jaipur': (26.9124, 75.7873),
}

DEFAULT_BASE_LAT = 10.0
DEFAULT_BASE_LNG = 75.0
TRAFFIC_BASE = 1.0


def geocode_location(location: str) -> tuple[float, float]:
    if not location:
        return DEFAULT_BASE_LAT, DEFAULT_BASE_LNG

    normalized = location.strip().lower()
    if normalized in KNOWN_LOCATIONS:
        return KNOWN_LOCATIONS[normalized]

    hashed = abs(hash(normalized))
    lat = 8.0 + (hashed % 2400) / 100.0   # 8.0  to 32.0
    lng = 68.0 + ((hashed // 2400) % 2400) / 100.0  # 68.0 to 92.0
    return lat, lng


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0.0
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return r * c


def traffic_factor(origin: str, destination: str) -> float:
    seed = abs(hash(f'{origin or ""}:{destination or ""}'))
    return 1.0 + ((seed % 25) / 100.0)  # 1.00 to 1.24


def estimate_travel_time(distance_km: float, traffic: float, speed_kmh: float = 45.0) -> float:
    if distance_km <= 0:
        return 0.0
    return round((distance_km / speed_kmh) * 60.0 * traffic, 1)


def get_location_for_shipment(shipment: Shipment) -> tuple[float, float, float, float]:
    origin_lat = shipment.origin_lat if shipment.origin_lat is not None else geocode_location(shipment.origin)[0]
    origin_lng = shipment.origin_lng if shipment.origin_lng is not None else geocode_location(shipment.origin)[1]
    destination_lat = shipment.destination_lat if shipment.destination_lat is not None else geocode_location(shipment.destination)[0]
    destination_lng = shipment.destination_lng if shipment.destination_lng is not None else geocode_location(shipment.destination)[1]
    return origin_lat, origin_lng, destination_lat, destination_lng


def choose_best_route(shipment: Shipment, drivers: list[Driver], vehicles: list[Vehicle]) -> Optional[tuple[Driver, Vehicle, float, float, float, float, float]]:
    origin_lat, origin_lng, destination_lat, destination_lng = get_location_for_shipment(shipment)
    route_distance = haversine_distance(origin_lat, origin_lng, destination_lat, destination_lng)
    best_score = None
    best_choice = None

    for driver in drivers:
        for vehicle in vehicles:
            if vehicle.latitude is None or vehicle.longitude is None:
                continue
            reposition = haversine_distance(vehicle.latitude, vehicle.longitude, origin_lat, origin_lng)
            traffic = traffic_factor(shipment.origin, shipment.destination)
            score = reposition * 0.75 + route_distance * 0.25 + traffic * 2.0
            if best_score is None or score < best_score:
                best_score = score
                best_choice = (driver, vehicle, reposition, route_distance, traffic, origin_lat, origin_lng, destination_lat, destination_lng)

    if best_choice:
        return best_choice
    if drivers and vehicles:
        driver = drivers[0]
        vehicle = vehicles[0]
        reposition = haversine_distance(vehicle.latitude or origin_lat, vehicle.longitude or origin_lng, origin_lat, origin_lng)
        traffic = traffic_factor(shipment.origin, shipment.destination)
        return driver, vehicle, reposition, route_distance, traffic, origin_lat, origin_lng, destination_lat, destination_lng
    return None


def build_route_estimate(shipment: Shipment, drivers: list[Driver], vehicles: list[Vehicle]) -> dict:
    origin_lat, origin_lng, destination_lat, destination_lng = get_location_for_shipment(shipment)
    traffic = traffic_factor(shipment.origin, shipment.destination)
    # Try to get real route from routing service (OSRM); fall back to Haversine
    route_info = None
    try:
        route_info = route_service.get_route((origin_lat, origin_lng), (destination_lat, destination_lng))
    except Exception:
        route_info = None

    if route_info:
        route_distance = route_info.get("distance_km", 0.0)
        estimated_duration_min = route_info.get("duration_min", 0.0)
        route_geometry = route_info.get("geometry")
    else:
        route_distance = haversine_distance(origin_lat, origin_lng, destination_lat, destination_lng)
        estimated_duration_min = estimate_travel_time(route_distance, traffic)
        route_geometry = None
    available_drivers = [d for d in drivers if d.is_available]
    available_vehicles = [v for v in vehicles if v.current_status == 'available']
    recommendation = choose_best_route(shipment, available_drivers, available_vehicles)

    recommended_driver = recommendation[0] if recommendation else None
    recommended_vehicle = recommendation[1] if recommendation else None
    reposition_distance = recommendation[2] if recommendation else 0.0
    total_distance = route_distance + reposition_distance
    reposition_duration = estimate_travel_time(reposition_distance, 1.1)

    return {
        'shipment_id': shipment.id,
        'recommended_driver_id': recommended_driver.id if recommended_driver else None,
        'recommended_driver_name': recommended_driver.name if recommended_driver else None,
        'recommended_vehicle_id': recommended_vehicle.id if recommended_vehicle else None,
        'recommended_vehicle_plate': recommended_vehicle.plate_number if recommended_vehicle else None,
        'route_distance_km': round(route_distance, 1),
        'route_geometry': route_geometry,
        'reposition_distance_km': round(reposition_distance, 1),
        'total_distance_km': round(total_distance, 1),
        'route_duration_min': round(estimated_duration_min, 1),
        'reposition_duration_min': round(reposition_duration, 1),
        'estimated_duration_min': round(estimated_duration_min + reposition_duration, 1),
        'traffic_factor': round(traffic, 2),
        'origin_lat': origin_lat,
        'origin_lng': origin_lng,
        'destination_lat': destination_lat,
        'destination_lng': destination_lng,
    }
