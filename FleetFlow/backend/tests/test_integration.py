from datetime import datetime, timedelta


def test_end_to_end_trip_workflow(
    client,
    auth_headers,
    test_admin
):

    # --------------------------------------------------
    # 1. Create Driver
    # --------------------------------------------------

    driver_response = client.post(
        "/drivers/",
        headers=auth_headers,
        json={
            "user_id": test_admin.id,
            "name": "Test Driver",
            "email": "testdriver@example.com",
            "phone_number": "9876543210",
            "license_number": "TEST-LICENSE-001",
            "status": "Available"
        }
    )

    assert driver_response.status_code in (200, 201)

    driver = driver_response.json()
    driver_id = driver["id"]

    # --------------------------------------------------
    # 2. Create Vehicle
    # --------------------------------------------------

    vehicle_response = client.post(
        "/vehicles/",
        headers=auth_headers,
        json={
            "registration_number": "TEST-VEH-001",
            "vehicle_type": "Truck",
            "capacity": 1500,
            "fuel_type": "Diesel",
            "current_status": "Available"
        }
    )

    assert vehicle_response.status_code in (200, 201)

    vehicle = vehicle_response.json()
    vehicle_id = vehicle["id"]

    # --------------------------------------------------
    # 3. Create Shipment
    # --------------------------------------------------

    shipment_response = client.post(
        "/shipments/",
        headers=auth_headers,
        json={
            "sender_name": "Test Sender",
            "receiver_name": "Test Receiver",
            "pickup_location": "Koramangala, Bengaluru",
            "delivery_location": "Whitefield, Bengaluru",
            "weight": 500,
            "driver_id": driver_id,
            "vehicle_id": vehicle_id
        }
    )

    assert shipment_response.status_code in (200, 201)

    shipment = shipment_response.json()
    shipment_id = shipment["id"]

    # --------------------------------------------------
    # 4. Create Trip
    # --------------------------------------------------

    start_time = datetime.now().astimezone()
    end_time = start_time + timedelta(hours=2)

    trip_response = client.post(
        "/trips/",
        headers=auth_headers,
        json={
            "shipment_id": shipment_id,
            "driver_id": driver_id,
            "vehicle_id": vehicle_id,
            "pickup_location": "Koramangala, Bengaluru",
            "delivery_location": "Whitefield, Bengaluru",
            "scheduled_start_time": start_time.isoformat(),
            "scheduled_end_time": end_time.isoformat()
        }
    )

    assert trip_response.status_code in (200, 201)

    trip = trip_response.json()
    trip_id = trip["id"]

    assert trip["trip_status"] == "Scheduled"

    # --------------------------------------------------
    # 5. Create Driver Assignment
    # --------------------------------------------------

    assignment_response = client.post(
        "/driver-assignments/",
        headers=auth_headers,
        json={
            "driver_id": driver_id,
            "vehicle_id": vehicle_id,
            "trip_id": trip_id,
            "assignment_status": "Active",
            "remarks": "Integration test assignment"
        }
    )

    assert assignment_response.status_code in (200, 201)

    assignment = assignment_response.json()
    assignment_id = assignment["id"]

    # --------------------------------------------------
    # 6. Start Trip
    # --------------------------------------------------

    start_response = client.put(
        f"/trips/{trip_id}",
        headers=auth_headers,
        json={
            "trip_status": "Started"
        }
    )

    assert start_response.status_code == 200

    started_trip = start_response.json()

    assert started_trip["trip_status"] == "Started"
    assert started_trip["started_at"] is not None

    # --------------------------------------------------
    # 7. Verify Shipment is In Transit
    # --------------------------------------------------

    shipment_response = client.get(
        f"/shipments/{shipment_id}",
        headers=auth_headers
    )

    assert shipment_response.status_code == 200

    shipment = shipment_response.json()

    assert shipment["current_status"] == "In Transit"

    # --------------------------------------------------
    # 8. Complete Trip
    # --------------------------------------------------

    complete_response = client.put(
        f"/trips/{trip_id}",
        headers=auth_headers,
        json={
            "trip_status": "Completed"
        }
    )

    assert complete_response.status_code == 200

    completed_trip = complete_response.json()

    assert completed_trip["trip_status"] == "Completed"
    assert completed_trip["started_at"] is not None
    assert completed_trip["completed_at"] is not None

    # --------------------------------------------------
    # 9. Verify Shipment is Delivered
    # --------------------------------------------------

    shipment_response = client.get(
        f"/shipments/{shipment_id}",
        headers=auth_headers
    )

    assert shipment_response.status_code == 200

    shipment = shipment_response.json()

    assert shipment["current_status"] == "Delivered"

    # --------------------------------------------------
    # 10. Verify Driver is Available
    # --------------------------------------------------

    driver_response = client.get(
        f"/drivers/{driver_id}",
        headers=auth_headers
    )

    assert driver_response.status_code == 200

    driver = driver_response.json()

    assert driver["status"] == "Available"

    # --------------------------------------------------
    # 11. Verify Vehicle is Available
    # --------------------------------------------------

    vehicle_response = client.get(
        f"/vehicles/{vehicle_id}",
        headers=auth_headers
    )

    assert vehicle_response.status_code == 200

    vehicle = vehicle_response.json()

    assert vehicle["current_status"] == "Available"

    # --------------------------------------------------
    # 12. Verify Assignment is Completed
    # --------------------------------------------------

    assignment_response = client.get(
        f"/driver-assignments/{assignment_id}",
        headers=auth_headers
    )

    assert assignment_response.status_code == 200

    assignment = assignment_response.json()

    assert assignment["assignment_status"] == "Completed"


def test_maintenance_alert_workflow(
    client,
    auth_headers
):

    # --------------------------------------------------
    # 1. Create Vehicle
    # --------------------------------------------------

    vehicle_response = client.post(
        "/vehicles/",
        headers=auth_headers,
        json={
            "registration_number": "TEST-MAINT-001",
            "vehicle_type": "Truck",
            "capacity": 1200,
            "fuel_type": "Diesel",
            "current_status": "Available"
        }
    )

    assert vehicle_response.status_code in (200, 201)

    vehicle = vehicle_response.json()
    vehicle_id = vehicle["id"]

    # --------------------------------------------------
    # 2. Create Maintenance Record
    # --------------------------------------------------

    maintenance_response = client.post(
        "/maintenance/",
        headers=auth_headers,
        json={
            "vehicle_id": vehicle_id,
            "maintenance_category": "Oil Change",
            "service_date": "2026-08-15",
            "next_service_date": "2026-11-15",
            "service_cost": 2500,
            "service_provider": "Test Service Center",
            "maintenance_status": "Scheduled",
            "notes": "Integration test maintenance"
        }
    )

    assert maintenance_response.status_code in (200, 201)

    maintenance = maintenance_response.json()
    maintenance_id = maintenance["id"]

    # --------------------------------------------------
    # 3. Verify Vehicle is Under Maintenance
    # --------------------------------------------------

    vehicle_response = client.get(
        f"/vehicles/{vehicle_id}",
        headers=auth_headers
    )

    assert vehicle_response.status_code == 200

    vehicle = vehicle_response.json()

    assert vehicle["current_status"] == "Under Maintenance"

    # --------------------------------------------------
    # 4. Create Maintenance Alert
    # --------------------------------------------------

    alert_response = client.post(
        "/maintenance-alerts/",
        headers=auth_headers,
        json={
            "vehicle_id": vehicle_id,
            "maintenance_id": maintenance_id,
            "alert_message": (
                "Vehicle is due for scheduled maintenance."
            ),
            "alert_type": "Maintenance Due",
            "alert_status": "Pending",
            "next_service_date": "2026-11-15"
        }
    )

    assert alert_response.status_code in (200, 201)

    alert = alert_response.json()
    alert_id = alert["id"]

    assert alert["alert_status"] == "Pending"

    # --------------------------------------------------
    # 5. Complete Maintenance
    # --------------------------------------------------

    complete_response = client.put(
        f"/maintenance/{maintenance_id}",
        headers=auth_headers,
        json={
            "maintenance_status": "Completed"
        }
    )

    assert complete_response.status_code == 200

    maintenance = complete_response.json()

    assert maintenance["maintenance_status"] == "Completed"

    # --------------------------------------------------
    # 6. Verify Vehicle is Available
    # --------------------------------------------------

    vehicle_response = client.get(
        f"/vehicles/{vehicle_id}",
        headers=auth_headers
    )

    assert vehicle_response.status_code == 200

    vehicle = vehicle_response.json()

    assert vehicle["current_status"] == "Available"

    # --------------------------------------------------
    # 7. Verify Alert is Automatically Completed
    # --------------------------------------------------

    alert_response = client.get(
        f"/maintenance-alerts/{alert_id}",
        headers=auth_headers
    )

    assert alert_response.status_code == 200

    alert = alert_response.json()

    assert alert["alert_status"] == "Completed"


def test_fuel_and_analytics_workflow(
    client,
    auth_headers,
    db
):

    # --------------------------------------------------
    # 1. Create Separate Test User
    # --------------------------------------------------

    from app.models.user import User
    from app.auth.hashing import hash_password

    fuel_user = User(
        username="fueltestuser",
        email="fueltestuser@example.com",
        password_hash=hash_password(
            "TestPassword123!"
        ),
        role="Driver"
    )

    db.add(fuel_user)
    db.commit()
    db.refresh(fuel_user)

    # --------------------------------------------------
    # 2. Create Driver
    # --------------------------------------------------

    driver_response = client.post(
        "/drivers/",
        headers=auth_headers,
        json={
            "user_id": fuel_user.id,
            "name": "Fuel Test Driver",
            "email": "fueltestdriver@example.com",
            "phone_number": "9876543211",
            "license_number": "FUEL-TEST-001",
            "status": "Available"
        }
    )

    assert driver_response.status_code in (200, 201)

    driver = driver_response.json()
    driver_id = driver["id"]

    # --------------------------------------------------
    # 3. Create Vehicle 1
    # --------------------------------------------------

    vehicle_response = client.post(
        "/vehicles/",
        headers=auth_headers,
        json={
            "registration_number": "TEST-FUEL-001",
            "vehicle_type": "Truck",
            "capacity": 1500,
            "fuel_type": "Diesel",
            "current_status": "Available"
        }
    )

    assert vehicle_response.status_code in (200, 201)

    vehicle_1 = vehicle_response.json()
    vehicle_1_id = vehicle_1["id"]

    # --------------------------------------------------
    # 4. Create Vehicle 2
    # --------------------------------------------------

    vehicle_response = client.post(
        "/vehicles/",
        headers=auth_headers,
        json={
            "registration_number": "TEST-FUEL-002",
            "vehicle_type": "Truck",
            "capacity": 1500,
            "fuel_type": "Diesel",
            "current_status": "Available"
        }
    )

    assert vehicle_response.status_code in (200, 201)

    vehicle_2 = vehicle_response.json()
    vehicle_2_id = vehicle_2["id"]

    # --------------------------------------------------
    # 5. Create Fuel Record for Vehicle 1
    # --------------------------------------------------

    fuel_response = client.post(
        "/fuel-records/",
        headers=auth_headers,
        json={
            "vehicle_id": vehicle_1_id,
            "driver_id": driver_id,
            "fuel_quantity": 40,
            "fuel_cost": 4000,
            "odometer_reading": 10000,
            "fuel_date": "2026-08-15",
            "fuel_station": "Test Fuel Station",
            "remarks": "Integration test fuel record"
        }
    )

    assert fuel_response.status_code in (200, 201)

    # --------------------------------------------------
    # 6. Create Fuel Record for Vehicle 2
    # --------------------------------------------------

    fuel_response = client.post(
        "/fuel-records/",
        headers=auth_headers,
        json={
            "vehicle_id": vehicle_2_id,
            "driver_id": driver_id,
            "fuel_quantity": 20,
            "fuel_cost": 2000,
            "odometer_reading": 15000,
            "fuel_date": "2026-08-15",
            "fuel_station": "Test Fuel Station",
            "remarks": "Integration test fuel record"
        }
    )

    assert fuel_response.status_code in (200, 201)

    # --------------------------------------------------
    # 7. Get Fuel Analytics
    # --------------------------------------------------

    analytics_response = client.get(
        "/analytics/fuel",
        headers=auth_headers
    )

    assert analytics_response.status_code == 200

    analytics = analytics_response.json()

    # --------------------------------------------------
    # 8. Verify Analytics
    # --------------------------------------------------

    assert analytics["total_fuel_consumed"] == 60
    assert analytics["total_fuel_cost"] == 6000
    assert analytics["average_fuel_consumption"] == 30

    assert (
        analytics["vehicle_with_highest_fuel_usage"]
        == vehicle_1_id
    )

    assert (
        analytics["vehicle_with_lowest_fuel_usage"]
        == vehicle_2_id
    )


def test_operational_analytics(
    client,
    auth_headers,
    monkeypatch
):

    # --------------------------------------------------
    # 1. Mock Route Calculation
    # --------------------------------------------------

    def mock_get_route(
        pickup_location,
        delivery_location
    ):
        return {
            "distance_km": 50.0
        }

    monkeypatch.setattr(
        "app.services.operational_analytics.get_route",
        mock_get_route
    )

    # --------------------------------------------------
    # 2. Get Operational Analytics
    # --------------------------------------------------

    response = client.get(
        "/analytics/operations",
        headers=auth_headers
    )

    assert response.status_code == 200

    analytics = response.json()

    # --------------------------------------------------
    # 3. Verify Fields
    # --------------------------------------------------

    assert "total_deliveries" in analytics
    assert "successful_deliveries" in analytics
    assert "delayed_deliveries" in analytics
    assert "cancelled_deliveries" in analytics
    assert "average_trip_distance" in analytics
    assert "average_delivery_time_minutes" in analytics

    # --------------------------------------------------
    # 4. Verify Counts
    # --------------------------------------------------

    assert analytics["total_deliveries"] >= 0

    assert (
        analytics["successful_deliveries"]
        <= analytics["total_deliveries"]
    )

    assert (
        analytics["cancelled_deliveries"]
        <= analytics["total_deliveries"]
    )

    assert (
        analytics["delayed_deliveries"]
        <= analytics["successful_deliveries"]
    )

    # --------------------------------------------------
    # 5. Verify Distance
    # --------------------------------------------------

    assert analytics["average_trip_distance"] >= 0

    # --------------------------------------------------
    # 6. Verify Delivery Time
    # --------------------------------------------------

    assert (
        analytics["average_delivery_time_minutes"]
        >= 0
    )