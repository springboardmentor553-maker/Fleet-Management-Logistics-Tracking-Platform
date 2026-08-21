# 📡 FleetFlow — API Documentation

## Overview

FleetFlow exposes a comprehensive REST API built with **FastAPI**. All endpoints return JSON responses. Protected endpoints require a `Bearer` JWT token in the `Authorization` header.

- **Base URL:** `http://localhost:8000`
- **Interactive Docs (Swagger UI):** `http://localhost:8000/docs`
- **OpenAPI Schema:** `http://localhost:8000/openapi.json`
- **API Version:** `1.0.0`

---

## Authentication

All protected endpoints require:

```http
Authorization: Bearer <access_token>
```

### Obtaining a Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@fleetflow.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## Role Permissions Reference

| Role | Abbreviation | Access Level |
|---|---|---|
| `admin` | A | Full access to all endpoints |
| `fleet_manager` | FM | Vehicles, Drivers, Dashboard, Maintenance, Fuel |
| `dispatcher` | D | Shipments, Driver Assignment, Dashboard |
| `driver` | Dr | Own shipments, GPS updates, own profile |

---

## Endpoint Reference

---

### 🔐 Authentication — `/auth`

#### POST `/auth/register`
Register a new user account.

**Access:** Public

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "driver"
}
```

**Response `201`:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "driver",
  "is_active": true,
  "created_at": "2026-08-17T10:00:00"
}
```

---

#### POST `/auth/login`
Login and receive JWT access token.

**Access:** Public

**Request Body (form-data / JSON):**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

**Errors:**
- `401` — Invalid credentials
- `400` — Account inactive

---

#### GET `/auth/me`
Get the currently authenticated user's profile.

**Access:** Any authenticated user

**Response `200`:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-08-17T10:00:00"
}
```

---

### 👑 Admin — `/admin`

#### GET `/admin/users`
List all registered users.

**Access:** Admin only

**Response `200`:** Array of user objects

---

#### PATCH `/admin/users/{user_id}/activate`
Activate a user account.

**Access:** Admin only | **Path Params:** `user_id: int`

**Response `200`:** Updated user object

---

#### PATCH `/admin/users/{user_id}/deactivate`
Deactivate a user account.

**Access:** Admin only | **Path Params:** `user_id: int`

**Response `200`:** Updated user object

---

#### PATCH `/admin/users/{user_id}/role`
Change a user's role.

**Access:** Admin only | **Path Params:** `user_id: int`

**Request Body:**
```json
{ "role": "fleet_manager" }
```

**Response `200`:** Updated user object

---

### 🚛 Vehicles — `/vehicles`

#### GET `/vehicles/`
List all vehicles in the fleet.

**Access:** Admin, Fleet Manager

**Query Params:**
- `status` (optional): Filter by `available` / `in_transit` / `maintenance`

**Response `200`:**
```json
[
  {
    "id": 1,
    "plate_number": "KL-01-AB-1234",
    "vehicle_type": "Truck",
    "model": "Tata Prima",
    "capacity_kg": 10000.0,
    "fuel_type": "Diesel",
    "current_status": "available",
    "latitude": 10.8505,
    "longitude": 76.2711,
    "created_at": "2026-08-17T10:00:00"
  }
]
```

---

#### GET `/vehicles/{vehicle_id}`
Get a specific vehicle by ID.

**Access:** Admin, Fleet Manager | **Path Params:** `vehicle_id: int`

**Response `200`:** Vehicle object | `404` — Vehicle not found

---

#### POST `/vehicles/`
Add a new vehicle to the fleet.

**Access:** Admin, Fleet Manager

**Request Body:**
```json
{
  "plate_number": "KL-01-AB-1234",
  "vehicle_type": "Truck",
  "model": "Tata Prima",
  "capacity_kg": 10000.0,
  "fuel_type": "Diesel"
}
```

**Response `201`:** Created vehicle object

---

#### PUT `/vehicles/{vehicle_id}`
Update vehicle details.

**Access:** Admin, Fleet Manager | **Path Params:** `vehicle_id: int`

**Request Body:** Partial or full vehicle fields

**Response `200`:** Updated vehicle object

---

#### DELETE `/vehicles/{vehicle_id}`
Remove a vehicle from the fleet.

**Access:** Admin, Fleet Manager | **Path Params:** `vehicle_id: int`

**Response `204`:** No content

---

### 👤 Drivers — `/drivers`

#### GET `/drivers/`
List all drivers.

**Access:** Admin, Fleet Manager, Dispatcher

**Response `200`:** Array of driver objects with performance metrics

---

#### GET `/drivers/{driver_id}`
Get a driver by ID.

**Access:** Admin, Fleet Manager, Dispatcher | **Path Params:** `driver_id: int`

---

#### POST `/drivers/`
Register a new driver.

**Access:** Admin, Fleet Manager, Dispatcher

**Request Body:**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@fleetflow.com",
  "phone": "+91-9876543210",
  "license_number": "KL-2024-123456"
}
```

**Response `201`:** Created driver object

---

#### PUT `/drivers/{driver_id}`
Update driver information.

**Access:** Admin, Fleet Manager, Dispatcher

**Response `200`:** Updated driver object

---

#### DELETE `/drivers/{driver_id}`
Remove a driver.

**Access:** Admin, Fleet Manager, Dispatcher

**Response `204`:** No content

---

### 📦 Dispatcher — `/dispatcher`

#### GET `/dispatcher/shipments`
List all shipments with filters.

**Access:** Admin, Dispatcher

**Query Params:**
- `status`: Filter by status
- `skip`, `limit`: Pagination

**Response `200`:** Array of shipment objects

---

#### POST `/dispatcher/shipments`
Create a new shipment.

**Access:** Admin, Dispatcher

**Request Body:**
```json
{
  "origin": "Kochi",
  "destination": "Bangalore",
  "weight_kg": 2500.0,
  "origin_lat": 9.9312,
  "origin_lng": 76.2673,
  "destination_lat": 12.9716,
  "destination_lng": 77.5946
}
```

**Response `201`:** Created shipment object (status: `pending`)

---

#### PATCH `/dispatcher/shipments/{shipment_id}/assign`
Assign a driver and vehicle to a shipment.

**Access:** Admin, Dispatcher | **Path Params:** `shipment_id: int`

**Request Body:**
```json
{
  "driver_id": 3,
  "vehicle_id": 7
}
```

**Response `200`:** Updated shipment (status: `in_transit`)

**Side Effects:**
- Driver `is_available` → `false`
- Vehicle `current_status` → `in_transit`
- Trip record created

---

#### PATCH `/dispatcher/shipments/{shipment_id}/cancel`
Cancel a shipment.

**Access:** Admin, Dispatcher | **Path Params:** `shipment_id: int`

**Response `200`:** Updated shipment (status: `cancelled`)

---

### 🚗 Driver Self-Service — `/driver`

#### GET `/driver/my-shipments`
Get shipments assigned to the authenticated driver.

**Access:** Driver, Admin

**Response `200`:** Array of shipment objects

---

#### PATCH `/driver/shipments/{shipment_id}/deliver`
Mark a shipment as delivered.

**Access:** Driver, Admin | **Path Params:** `shipment_id: int`

**Response `200`:** Updated shipment (status: `delivered`)

**Side Effects:**
- Driver `is_available` → `true`
- Vehicle `current_status` → `available`
- `delivered_at` timestamped

---

### 📊 Dashboard — `/dashboard`

#### GET `/dashboard/stats`
Get real-time fleet KPI statistics.

**Access:** Any authenticated user

**Response `200`:**
```json
{
  "total_vehicles": 25,
  "active_vehicles": 18,
  "available_vehicles": 7,
  "maintenance_vehicles": 3,
  "total_drivers": 20,
  "available_drivers": 12,
  "total_shipments": 150,
  "pending_shipments": 8,
  "in_transit_shipments": 10,
  "delivered_shipments": 125,
  "cancelled_shipments": 7,
  "total_trips": 140,
  "active_alerts": 4
}
```

---

### 🛠️ Maintenance — `/maintenance`

#### GET `/maintenance/`
List all maintenance records.

**Access:** Admin, Fleet Manager

**Query Params:** `vehicle_id`, `status`, `skip`, `limit`

---

#### POST `/maintenance/`
Create a new maintenance record.

**Access:** Admin, Fleet Manager

**Request Body:**
```json
{
  "vehicle_id": 5,
  "category": "Oil Change",
  "description": "Routine engine oil change",
  "cost": 2500.00,
  "scheduled_date": "2026-09-01T10:00:00",
  "odometer_km": 45000,
  "health_score": 85,
  "service_provider": "Quick Lube Center",
  "next_service_date": "2026-12-01T10:00:00"
}
```

---

#### GET `/maintenance/{record_id}`
Get a specific maintenance record.

---

#### PUT `/maintenance/{record_id}`
Update a maintenance record.

---

#### DELETE `/maintenance/{record_id}`
Delete a maintenance record.

---

### 🔔 Maintenance Alerts — `/maintenance-alerts`

#### GET `/maintenance-alerts/`
List all maintenance alerts.

**Access:** Admin, Fleet Manager

**Query Params:** `alert_status`, `vehicle_id`

---

#### POST `/maintenance-alerts/`
Create a maintenance alert manually.

**Access:** Admin, Fleet Manager

**Request Body:**
```json
{
  "vehicle_id": 5,
  "maintenance_id": 12,
  "alert_message": "Engine oil overdue by 5,000 km",
  "alert_type": "overdue",
  "next_service_date": "2026-08-20T00:00:00"
}
```

---

#### PATCH `/maintenance-alerts/{alert_id}/status`
Update alert status (acknowledge/complete).

**Request Body:** `{ "alert_status": "Completed" }`

---

### ⛽ Fuel — `/fuel`

#### GET `/fuel/`
List all fuel records.

**Access:** Admin, Fleet Manager, Dispatcher

**Query Params:** `vehicle_id`, `driver_id`, `skip`, `limit`

---

#### POST `/fuel/`
Log a new fuel record.

**Access:** Admin, Fleet Manager, Driver

**Request Body:**
```json
{
  "vehicle_id": 3,
  "driver_id": 7,
  "fuel_quantity": 80.5,
  "fuel_cost": 9660.0,
  "odometer_reading": 48500.0,
  "fuel_station": "HP Petrol Station, Ernakulam",
  "remarks": "Full tank refill"
}
```

---

#### GET `/fuel/{record_id}`
Get a specific fuel record.

---

#### PUT `/fuel/{record_id}`
Update a fuel record.

---

#### DELETE `/fuel/{record_id}`
Delete a fuel record.

---

### 📈 Analytics — `/analytics`

#### GET `/analytics/fuel`
Get comprehensive fuel analytics.

**Access:** Any authenticated user

**Response `200`:**
```json
{
  "total_fuel_consumed": 5840.5,
  "total_fuel_cost": 702060.0,
  "average_fuel_consumption": 73.0,
  "vehicle_highest_usage": {
    "vehicle_id": 3,
    "plate_number": "KL-07-BC-5678",
    "total_fuel": 920.0
  },
  "vehicle_lowest_usage": {
    "vehicle_id": 12,
    "plate_number": "KL-02-ZX-9012",
    "total_fuel": 120.0
  }
}
```

---

#### GET `/analytics/operations`
Get operational performance analytics.

**Access:** Any authenticated user

**Response `200`:**
```json
{
  "total_deliveries": 150,
  "successful_deliveries": 125,
  "delayed_deliveries": 18,
  "cancelled_deliveries": 7,
  "average_trip_distance": 127.43,
  "average_delivery_time": 6.82
}
```

---

### 🔔 Notifications — `/notifications`

#### GET `/notifications/`
Get notifications for the current user.

**Access:** Any authenticated user

**Query Params:**
- `is_read`: Filter by read status (true/false)
- `priority`: Filter by priority level
- `skip`, `limit`: Pagination

---

#### POST `/notifications/`
Create a notification.

**Access:** Admin, Fleet Manager, Dispatcher

**Request Body:**
```json
{
  "user_id": 5,
  "title": "Shipment Assigned",
  "message": "You have been assigned Shipment #42 from Kochi to Bangalore.",
  "category": "driver_assignment",
  "priority": "high",
  "channel_push": true,
  "reference_id": 42,
  "reference_type": "shipment"
}
```

---

#### PATCH `/notifications/{notification_id}/read`
Mark a notification as read.

**Access:** Any authenticated user

**Response `200`:** Updated notification with `read_at` timestamp

---

#### PATCH `/notifications/read-all`
Mark all notifications as read for the current user.

**Access:** Any authenticated user

---

### 📍 GPS Tracking — `/gps`

#### PATCH `/gps/vehicles/{vehicle_id}/location`
Update a vehicle's GPS coordinates.

**Access:** Admin, Fleet Manager, Driver

**Request Body:**
```json
{
  "latitude": 10.8505,
  "longitude": 76.2711
}
```

**Response `200`:** Updated vehicle location object

**Side Effect:** Broadcasts to all WebSocket clients

---

#### GET `/gps/vehicles/locations`
Get current GPS coordinates of all vehicles.

**Access:** Any authenticated user

**Response `200`:**
```json
[
  {
    "id": 1,
    "plate_number": "KL-01-AB-1234",
    "latitude": 10.8505,
    "longitude": 76.2711,
    "current_status": "in_transit"
  }
]
```

---

### 📋 Reports Export — `/reports/export`

#### GET `/reports/export/fleet?format={pdf|xlsx}`
Export full fleet summary report.

**Access:** Admin, Fleet Manager

**Query Params:** `format` = `pdf` or `xlsx`

**Response:** File download (Content-Disposition: attachment)

---

#### GET `/reports/export/drivers?format={pdf|xlsx}`
Export driver performance report.

**Access:** Admin, Fleet Manager, Dispatcher

---

#### GET `/reports/export/fuel?format={pdf|xlsx}`
Export fuel consumption report.

**Access:** Admin, Fleet Manager

---

#### GET `/reports/export/maintenance?format={pdf|xlsx}`
Export maintenance history report.

**Access:** Admin, Fleet Manager

---

#### GET `/reports/export/shipments?format={pdf|xlsx}`
Export shipment/delivery report.

**Access:** Admin, Dispatcher

---

### 🌐 WebSocket Endpoints

#### `ws://localhost:8000/ws/tracking/{trip_id}`
Real-time trip-specific tracking socket.

**Message Format (received):**
```json
{
  "type": "connected",
  "trip_id": 42
}
```

---

#### `ws://localhost:8000/gps/ws/locations`
All-vehicle live GPS feed.

**Message Format (broadcast):**
```json
{
  "vehicle_id": 3,
  "plate_number": "KL-07-BC-5678",
  "latitude": 10.8505,
  "longitude": 76.2711,
  "current_status": "in_transit"
}
```

---

## HTTP Status Code Reference

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created successfully |
| `204` | Deleted successfully (no content) |
| `400` | Bad request / validation error |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (insufficient role) |
| `404` | Resource not found |
| `409` | Conflict (duplicate entry) |
| `422` | Unprocessable entity (schema error) |
| `500` | Internal server error |

---

## Request/Response Examples — cURL

### Login and get token
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetflow.com","password":"admin123"}'
```

### Create a vehicle
```bash
curl -X POST http://localhost:8000/vehicles/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plate_number": "KL-05-CD-9876",
    "vehicle_type": "Van",
    "model": "Mahindra Bolero",
    "capacity_kg": 1500,
    "fuel_type": "Diesel"
  }'
```

### Get fleet stats
```bash
curl http://localhost:8000/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

### Export fuel report as PDF
```bash
curl -O -J http://localhost:8000/reports/export/fuel?format=pdf \
  -H "Authorization: Bearer <token>"
```

---

*Document Version: 1.0 | Project: FleetFlow | Organization: Infosys Internship*
