# 🗄️ FleetFlow — Database Documentation

## Overview

FleetFlow uses **PostgreSQL 16** as its primary relational database, managed through **SQLAlchemy 2.0 ORM** with **Alembic** for schema migrations. The database consists of **10 core tables** covering all fleet management entities and their relationships.

---

## Database Configuration

| Parameter | Value |
|---|---|
| **Engine** | PostgreSQL 16 |
| **ORM** | SQLAlchemy 2.0 |
| **Migration Tool** | Alembic |
| **Default Port** | 5432 (Docker: 5433 → 5432) |
| **Database Name** | `fleetflow` |
| **Connection** | `postgresql://postgres:<password>@localhost:5432/fleetflow` |

---

## Entity Relationship Diagram (ERD)

```
┌───────────────┐         ┌───────────────────┐
│     users     │         │      drivers      │
│───────────────│         │───────────────────│
│ id (PK)       │         │ id (PK)           │
│ name          │         │ name              │
│ email (UQ)    │         │ email (UQ)        │
│ hashed_pass   │         │ phone             │
│ role          │         │ license_number(UQ)│
│ is_active     │         │ is_available      │
│ created_at    │         │ assigned_vehicle_id│──────────┐
└───────────────┘         │ attendance_status │          │
        │                 │ safety_score      │          │
        │                 │ completed_trips   │          │
        │1                │ total_distance_km │          │
        │                 │ rating            │          │
        ▼                 │ created_at        │          │
┌───────────────┐         └────────┬──────────┘          │
│ notifications │                  │1                    │
│───────────────│                  │                     │
│ id (PK)       │         ┌────────▼──────────┐          │
│ user_id (FK)  │         │    shipments      │          │
│ title         │         │───────────────────│          │
│ message       │         │ id (PK)           │          │
│ category      │         │ origin            │          │
│ channel_email │         │ destination       │     ┌────▼────────────┐
│ channel_sms   │         │ weight_kg         │     │    vehicles     │
│ channel_push  │         │ origin_lat        │     │─────────────────│
│ is_read       │         │ origin_lng        │     │ id (PK)         │
│ priority      │         │ destination_lat   │     │ plate_number(UQ)│
│ reference_id  │         │ destination_lng   │     │ vehicle_type    │
│ reference_type│         │ status            │     │ model           │
│ created_at    │         │ driver_id (FK)────┼─────┤ capacity_kg     │
│ read_at       │         │ vehicle_id (FK)───┼─────┤ fuel_type       │
└───────────────┘         │ created_at        │     │ assigned_driver │
                          │ delivered_at      │     │ current_status  │
                          └────────┬──────────┘     │ latitude        │
                                   │1               │ longitude       │
                                   │                │ created_at      │
                          ┌────────▼──────────┐     └────────┬────────┘
                          │      trips        │              │1
                          │───────────────────│              │
                          │ id (PK)           │    ┌─────────▼──────────┐
                          │ shipment_id (FK)  │    │ maintenance_records│
                          │ driver_id (FK)    │    │────────────────────│
                          │ vehicle_id (FK)   │    │ id (PK)            │
                          │ start_time        │    │ vehicle_id (FK)    │
                          │ end_time          │    │ category           │
                          │ pickup_lat        │    │ description        │
                          │ pickup_lng        │    │ cost               │
                          │ destination_lat   │    │ status             │
                          │ destination_lng   │    │ scheduled_date     │
                          │ status            │    │ completed_date     │
                          │ created_at        │    │ odometer_km        │
                          └───────────────────┘    │ health_score       │
                                                   │ notes              │
                                                   │ service_provider   │
              ┌────────────────────┐               │ next_service_date  │
              │   fuel_records     │               │ created_at         │
              │────────────────────│               └─────────┬──────────┘
              │ id (PK)            │                         │1
              │ vehicle_id (FK)    │               ┌─────────▼──────────┐
              │ driver_id (FK)     │               │ maintenance_alerts │
              │ fuel_quantity      │               │────────────────────│
              │ fuel_cost          │               │ id (PK)            │
              │ odometer_reading   │               │ vehicle_id (FK)    │
              │ fuel_date          │               │ maintenance_id (FK)│
              │ fuel_station       │               │ alert_message      │
              │ remarks            │               │ alert_type         │
              └────────────────────┘               │ alert_status       │
                                                   │ generated_date     │
              ┌────────────────────┐               │ next_service_date  │
              │ driver_attendance  │               │ created_at         │
              │────────────────────│               └────────────────────┘
              │ id (PK)            │
              │ driver_id (FK)     │
              │ date               │
              │ status             │
              │ check_in_time      │
              │ check_out_time     │
              │ notes              │
              └────────────────────┘
```

---

## Table Definitions

### 1. `users` — System Users

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique user ID |
| `name` | VARCHAR | NOT NULL | Full name |
| `email` | VARCHAR | UNIQUE, NOT NULL, INDEX | Login email |
| `hashed_password` | VARCHAR | NOT NULL | bcrypt hashed password |
| `role` | VARCHAR | NOT NULL | `admin` / `fleet_manager` / `dispatcher` / `driver` |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Registration timestamp |

**Indexes:** `email` (unique)

---

### 2. `drivers` — Driver Profiles

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Unique driver ID |
| `name` | VARCHAR | NOT NULL | Full name |
| `email` | VARCHAR | UNIQUE, NOT NULL, INDEX | Contact email |
| `phone` | VARCHAR | NOT NULL | Contact number |
| `license_number` | VARCHAR | UNIQUE, NOT NULL | Driver license |
| `is_available` | BOOLEAN | DEFAULT TRUE | Trip availability |
| `assigned_vehicle_id` | INTEGER | FK → vehicles.id, NULLABLE | Currently assigned vehicle |
| `attendance_status` | VARCHAR | DEFAULT 'present' | `present` / `absent` / `on_leave` |
| `safety_score` | INTEGER | DEFAULT 95 | Score 0–100 |
| `completed_trips_count` | INTEGER | DEFAULT 0 | Lifetime trip count |
| `total_distance_km` | FLOAT | DEFAULT 0.0 | Lifetime km driven |
| `rating` | FLOAT | DEFAULT 4.8 | Rating 1.0–5.0 |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Registration date |

**Indexes:** `email` (unique), `license_number` (unique)

**Relationships:**
- `assigned_vehicle` → `Vehicle` (many-to-one)
- `shipments` → `Shipment` (one-to-many, back-populated)

---

### 3. `vehicles` — Fleet Vehicles

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Unique vehicle ID |
| `plate_number` | VARCHAR | UNIQUE, NOT NULL, INDEX | License plate |
| `vehicle_type` | VARCHAR | NOT NULL | `Truck` / `Van` / `Bike` / etc. |
| `model` | VARCHAR | NOT NULL | Make and model name |
| `capacity_kg` | FLOAT | NOT NULL | Load capacity in kg |
| `fuel_type` | VARCHAR | NOT NULL | `Petrol` / `Diesel` / `Electric` / `CNG` |
| `assigned_driver_id` | INTEGER | FK → drivers.id, NULLABLE | Currently assigned driver |
| `current_status` | VARCHAR | DEFAULT 'available' | `available` / `in_transit` / `maintenance` |
| `latitude` | FLOAT | NULLABLE | Current GPS latitude |
| `longitude` | FLOAT | NULLABLE | Current GPS longitude |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Registration date |

**Indexes:** `plate_number` (unique)

**Relationships:**
- `assigned_driver` → `Driver` (many-to-one)
- `shipments` → `Shipment` (one-to-many, back-populated)

---

### 4. `shipments` — Cargo Shipments

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Unique shipment ID |
| `origin` | VARCHAR | NOT NULL | Pickup location name |
| `destination` | VARCHAR | NOT NULL | Drop-off location name |
| `weight_kg` | FLOAT | NOT NULL | Cargo weight in kg |
| `origin_lat` | FLOAT | NULLABLE | Pickup latitude |
| `origin_lng` | FLOAT | NULLABLE | Pickup longitude |
| `destination_lat` | FLOAT | NULLABLE | Destination latitude |
| `destination_lng` | FLOAT | NULLABLE | Destination longitude |
| `status` | VARCHAR | DEFAULT 'pending', INDEX | `pending` / `in_transit` / `delivered` / `cancelled` |
| `driver_id` | INTEGER | FK → drivers.id, NULLABLE, INDEX | Assigned driver |
| `vehicle_id` | INTEGER | FK → vehicles.id, NULLABLE, INDEX | Assigned vehicle |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `delivered_at` | TIMESTAMP | NULLABLE | Delivery completion timestamp |

**Indexes:** `status`, `driver_id`, `vehicle_id`

**Status Transitions:**
```
pending → in_transit → delivered
                └──────→ cancelled
```

---

### 5. `trips` — Active Trip Records

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Unique trip ID |
| `shipment_id` | INTEGER | FK → shipments.id, NOT NULL, INDEX | Associated shipment |
| `driver_id` | INTEGER | FK → drivers.id, NOT NULL, INDEX | Assigned driver |
| `vehicle_id` | INTEGER | FK → vehicles.id, NOT NULL, INDEX | Assigned vehicle |
| `start_time` | TIMESTAMP | NULLABLE | Trip start timestamp |
| `end_time` | TIMESTAMP | NULLABLE | Trip end timestamp |
| `pickup_latitude` | FLOAT | NULLABLE | GPS pickup point |
| `pickup_longitude` | FLOAT | NULLABLE | GPS pickup point |
| `destination_latitude` | FLOAT | NULLABLE | GPS destination |
| `destination_longitude` | FLOAT | NULLABLE | GPS destination |
| `status` | VARCHAR | DEFAULT 'scheduled', INDEX | `scheduled` / `started` / `completed` / `cancelled` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation |

**Computed Properties (SQLAlchemy @property):**
- `shipment_origin` — from related Shipment
- `shipment_destination` — from related Shipment
- `driver_name` — from related Driver
- `vehicle_plate` — from related Vehicle

---

### 6. `fuel_records` — Fuel Consumption Logs

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Unique record ID |
| `vehicle_id` | INTEGER | FK → vehicles.id, NOT NULL, INDEX | Fueled vehicle |
| `driver_id` | INTEGER | FK → drivers.id, NOT NULL, INDEX | Driver who fueled |
| `fuel_quantity` | FLOAT | NOT NULL | Liters fueled |
| `fuel_cost` | FLOAT | NOT NULL | Total cost (currency) |
| `odometer_reading` | FLOAT | NOT NULL | Odometer at fueling |
| `fuel_date` | TIMESTAMP | DEFAULT NOW(), NOT NULL | Fueling date/time |
| `fuel_station` | VARCHAR | NOT NULL | Station name/location |
| `remarks` | VARCHAR | NULLABLE | Optional notes |

---

### 7. `maintenance_records` — Vehicle Maintenance

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Unique record ID |
| `vehicle_id` | INTEGER | FK → vehicles.id, NOT NULL, INDEX | Maintained vehicle |
| `category` | VARCHAR | NOT NULL | `Oil Change` / `Tire Replacement` / `Engine Service` / `Brake Service` / `General Inspection` |
| `description` | TEXT | NULLABLE | Detailed description |
| `cost` | FLOAT | DEFAULT 0.0 | Maintenance cost |
| `status` | VARCHAR | DEFAULT 'scheduled', INDEX | `scheduled` / `in_progress` / `completed` / `cancelled` |
| `scheduled_date` | TIMESTAMP | DEFAULT NOW() | When service is scheduled |
| `completed_date` | TIMESTAMP | NULLABLE | When service was completed |
| `odometer_km` | FLOAT | DEFAULT 0.0 | Odometer at service |
| `health_score` | INTEGER | DEFAULT 100 | Vehicle health 0–100 |
| `notes` | TEXT | NULLABLE | Technician notes |
| `service_provider` | VARCHAR | NULLABLE | Workshop/garage name |
| `next_service_date` | TIMESTAMP | NULLABLE | Recommended next service |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation date |

---

### 8. `maintenance_alerts` — Service Alerts

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Unique alert ID |
| `vehicle_id` | INTEGER | FK → vehicles.id, NOT NULL, INDEX | Affected vehicle |
| `maintenance_id` | INTEGER | FK → maintenance_records.id, NOT NULL, INDEX | Related maintenance record |
| `alert_message` | TEXT | NOT NULL | Alert description |
| `alert_type` | VARCHAR | DEFAULT 'service_due' | `service_due` / `overdue` / `health_critical` / `upcoming` |
| `alert_status` | VARCHAR | DEFAULT 'Pending', INDEX | `Pending` / `Sent` / `Completed` |
| `generated_date` | TIMESTAMP | DEFAULT NOW(), NOT NULL | When alert was created |
| `next_service_date` | TIMESTAMP | NULLABLE | Recommended service date |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation date |

---

### 9. `notifications` — User Notifications

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Unique notification ID |
| `user_id` | INTEGER | FK → users.id, NULLABLE, INDEX | Target user (NULL = broadcast) |
| `title` | VARCHAR | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Full message body |
| `category` | VARCHAR | DEFAULT 'push', INDEX | `maintenance_alert` / `delivery` / `driver_assignment` / `shipment_status` / `route_change` / `email` / `sms` / `push` |
| `channel_email` | BOOLEAN | DEFAULT FALSE | Email delivery flag |
| `channel_sms` | BOOLEAN | DEFAULT FALSE | SMS delivery flag |
| `channel_push` | BOOLEAN | DEFAULT TRUE | Push notification flag |
| `is_read` | BOOLEAN | DEFAULT FALSE, INDEX | Read status |
| `priority` | VARCHAR | DEFAULT 'normal' | `low` / `normal` / `high` / `critical` |
| `reference_id` | INTEGER | NULLABLE | FK to related entity |
| `reference_type` | VARCHAR | NULLABLE | `trip` / `shipment` / `driver` / `maintenance` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `read_at` | TIMESTAMP | NULLABLE | When notification was read |

---

### 10. `driver_attendance` — Attendance Records

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Unique record ID |
| `driver_id` | INTEGER | FK → drivers.id, NOT NULL | Driver reference |
| `date` | DATE | NOT NULL | Attendance date |
| `status` | VARCHAR | NOT NULL | `present` / `absent` / `on_leave` |
| `check_in_time` | TIMESTAMP | NULLABLE | Check-in timestamp |
| `check_out_time` | TIMESTAMP | NULLABLE | Check-out timestamp |
| `notes` | TEXT | NULLABLE | Optional remarks |

---

## Relationships Summary

| From | To | Relationship | Key |
|---|---|---|---|
| `notifications` | `users` | Many-to-one | `notifications.user_id → users.id` |
| `drivers` | `vehicles` | Many-to-one (assigned) | `drivers.assigned_vehicle_id → vehicles.id` |
| `vehicles` | `drivers` | Many-to-one (assigned) | `vehicles.assigned_driver_id → drivers.id` |
| `shipments` | `drivers` | Many-to-one | `shipments.driver_id → drivers.id` |
| `shipments` | `vehicles` | Many-to-one | `shipments.vehicle_id → vehicles.id` |
| `trips` | `shipments` | Many-to-one | `trips.shipment_id → shipments.id` |
| `trips` | `drivers` | Many-to-one | `trips.driver_id → drivers.id` |
| `trips` | `vehicles` | Many-to-one | `trips.vehicle_id → vehicles.id` |
| `fuel_records` | `vehicles` | Many-to-one | `fuel_records.vehicle_id → vehicles.id` |
| `fuel_records` | `drivers` | Many-to-one | `fuel_records.driver_id → drivers.id` |
| `maintenance_records` | `vehicles` | Many-to-one | `maintenance_records.vehicle_id → vehicles.id` |
| `maintenance_alerts` | `vehicles` | Many-to-one | `maintenance_alerts.vehicle_id → vehicles.id` |
| `maintenance_alerts` | `maintenance_records` | Many-to-one | `maintenance_alerts.maintenance_id → maintenance_records.id` |

---

## Migration Management

```bash
# Create a new migration after model changes
alembic revision --autogenerate -m "description of change"

# Apply all pending migrations
alembic upgrade head

# Rollback the last migration
alembic downgrade -1

# View migration history
alembic history --verbose

# Check current schema version
alembic current
```

Migrations are stored in: `Backend/migrations/versions/`

---

## Common Queries Reference

### Get all available drivers with their vehicles
```sql
SELECT d.*, v.plate_number, v.model
FROM drivers d
LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
WHERE d.is_available = true;
```

### Get active shipments with driver and vehicle info
```sql
SELECT s.*, d.name as driver_name, v.plate_number
FROM shipments s
JOIN drivers d ON s.driver_id = d.id
JOIN vehicles v ON s.vehicle_id = v.id
WHERE s.status = 'in_transit';
```

### Get fuel cost per vehicle
```sql
SELECT v.plate_number, SUM(f.fuel_cost) as total_cost, SUM(f.fuel_quantity) as total_liters
FROM fuel_records f
JOIN vehicles v ON f.vehicle_id = v.id
GROUP BY v.plate_number
ORDER BY total_cost DESC;
```

### Get vehicles with critical health score
```sql
SELECT v.plate_number, m.health_score, m.category
FROM maintenance_records m
JOIN vehicles v ON m.vehicle_id = v.id
WHERE m.health_score < 50
ORDER BY m.health_score ASC;
```

---

*Document Version: 1.0 | Project: FleetFlow | Organization: Infosys Internship*
