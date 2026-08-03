# FleetFlow — Fleet Management & Logistics Tracking Platform

> A centralized fleet management and logistics tracking platform for organizations to monitor vehicles, manage drivers, optimize routes, and track shipments in real time.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Features Implemented](#features-implemented)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Quick Start](#quick-start)
- [Sample Users & Login Credentials](#sample-users--login-credentials)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Milestones](#milestones)

---

## Overview

FleetFlow is a full-stack logistics and fleet management platform built to help logistics companies, delivery services, courier agencies, and enterprise fleet operators manage their day-to-day transport operations through a single dashboard.

**Core capabilities:**
- Real-time vehicle and shipment tracking via WebSocket
- Route optimization and turn-by-turn directions using OSRM + Leaflet Routing Machine
- Driver and vehicle management with role-based access control
- Maintenance scheduling with automatic vehicle status synchronization
- Shipment lifecycle tracking from creation to delivery
- Trip scheduling with ETA calculation and geocoding
- **Driver Attendance & Assignments** for tracking driver shifts and trip allocation
- **Fuel Monitoring & Analytics** to track fleet fuel consumption and costs
- **Maintenance Alerts & Reporting** with automated background task scheduling (Celery)

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Authentication | JWT (access + refresh tokens) |
| Real-time | WebSocket (via `uvicorn[standard]`) |
| Routing Engine | OSRM (Open Source Routing Machine) |
| Geocoding | OpenStreetMap Nominatim |
| HTTP Client | httpx |
| Task Queue | Celery + Redis |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router DOM v6 |
| Maps | Leaflet.js + Leaflet Routing Machine |
| HTTP | Axios |
| Styling | Vanilla CSS (custom design system) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  Dashboard │ Vehicles │ Drivers │ Shipments │ Trips      │
│  Live Tracking (Leaflet Map + WebSocket)                 │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────────────┐
│                   FastAPI Backend                        │
│  /auth  /vehicles  /drivers  /shipments  /trips          │
│  /maintenance  /tracking  /dashboard                     │
│  WS: /ws/tracking/{trip_id}                              │
└───────────────────────┬─────────────────────────────────┘
                        │ SQLAlchemy ORM
┌───────────────────────▼─────────────────────────────────┐
│                    PostgreSQL                            │
│  users │ drivers │ vehicles │ shipments │ trips          │
│  maintenance_records                                     │
└─────────────────────────────────────────────────────────┘
                        │ External APIs
                   OSRM (routing)
                   Nominatim (geocoding)
```

---

## Features Implemented

### Milestone 1 — Project Initialization & Core Setup
- [x] System architecture and database schema design
- [x] React + Vite frontend setup with custom dark-mode design system
- [x] FastAPI backend with modular router structure
- [x] PostgreSQL integration with SQLAlchemy 2.0
- [x] Alembic database migrations
- [x] JWT authentication — register / login / refresh / `/auth/me`
- [x] Role-based access control (Admin, Fleet Manager, Driver, Dispatcher)
- [x] Fleet monitoring dashboard with live summary stats
- [x] Vehicle registration and CRUD workflows
- [x] Driver management with CRUD workflows

### Milestone 2 — Shipment Tracking & Route Optimization
- [x] Shipment lifecycle management (8 status states: CREATED → DELIVERED)
- [x] Trip scheduling with driver + vehicle assignment
- [x] OSRM-powered route planning (distance, travel time, encoded polyline)
- [x] Geocoding via OpenStreetMap Nominatim (city name → lat/lng)
- [x] ETA calculation from OSRM route duration + scheduled departure
- [x] WebSocket real-time tracking endpoint `/ws/tracking/{trip_id}`
- [x] Connection Manager — multi-client broadcasting per trip
- [x] Live vehicle GPS simulation following actual OSRM road waypoints (polyline decoded + stepped through per tick)
- [x] Real-time shipment status broadcast on every PATCH update
- [x] Leaflet map with Leaflet Routing Machine — road-accurate blue route line
- [x] Turn-by-turn directions panel in Live Tracking UI
- [x] Vehicle 🚛 marker moves exactly along the displayed road route (not random drift)
- [x] Multi-viewer WebSocket support (viewer count shown live)

### Milestone 3 — Maintenance Management
- [x] Maintenance model with full field set (ID, vehicle FK, category, dates, cost, provider, status, notes, created_at)
- [x] 5 predefined maintenance categories (enum-locked — no free-text)
- [x] Full CRUD API (`/maintenance`)
- [x] One-to-many relationship: one Vehicle → many MaintenanceRecords
- [x] Vehicle ID validation — invalid IDs return HTTP 404
- [x] **Vehicle status auto-sync on maintenance status change:**
  - `IN_PROGRESS` → Vehicle becomes `MAINTENANCE`
  - `COMPLETED` / `CANCELLED` → Vehicle becomes `AVAILABLE`
- [x] **Soft-delete only** — history is NEVER erased (`DELETE` sets `status=CANCELLED`, row preserved)
- [x] Filter records by `vehicle_id`, `status`, `category`

### Milestone 4 — Driver Ops, Fuel Monitoring & Background Tasks
- [x] **Driver Assignment** model & APIs to allocate drivers to vehicles and trips dynamically.
- [x] **Driver Attendance** model & APIs to track daily shifts (Present, Absent, Leave) with Check-In / Check-Out times.
- [x] **Fuel Monitoring** model & CRUD APIs for detailed fuel logs per vehicle and driver.
- [x] **Dynamic Analytics endpoints**: Dynamic computation of Fleet Dashboard stats, Fuel Analytics, and Operational delivery metrics without storing derived data.
- [x] **Maintenance Alerts & Reports**: Dynamic aggregated maintenance reports and automated alert generation.
- [x] **Celery & Redis Integration**: Configured Celery worker and beat scheduler to automatically generate pending alerts for upcoming/overdue maintenance tasks.
- [x] **Fully responsive UI design**: Added mobile and tablet optimizations for sidebar, modals, data tables, and metrics dashboards.

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| email | VARCHAR UNIQUE | |
| hashed_password | VARCHAR | bcrypt |
| role | ENUM | ADMIN, FLEET_MANAGER, DRIVER, DISPATCHER |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |

### `drivers`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users | |
| license_number | VARCHAR UNIQUE | |
| phone | VARCHAR | |
| status | VARCHAR | AVAILABLE, ON_DUTY, OFF_DUTY |

### `vehicles`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| registration_number | VARCHAR UNIQUE | |
| vehicle_type | VARCHAR | |
| capacity | FLOAT | tonnes |
| fuel_type | VARCHAR | |
| current_status | ENUM | AVAILABLE, IN_USE, MAINTENANCE |
| manager_id | INTEGER FK → users | |
| driver_id | INTEGER FK → drivers | |

### `shipments`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| tracking_number | VARCHAR UNIQUE | e.g. FLT100001 |
| sender_name / receiver_name | VARCHAR | |
| pickup_location / delivery_location | VARCHAR | |
| weight | FLOAT | kg |
| status | ENUM | CREATED, ASSIGNED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, DELAYED, CANCELLED |
| driver_id | INTEGER FK → drivers | |
| vehicle_id | INTEGER FK → vehicles | |
| trip_id | INTEGER FK → trips | |

### `trips`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| shipment_id | INTEGER FK → shipments | |
| driver_id | INTEGER FK → drivers | |
| vehicle_id | INTEGER FK → vehicles | |
| pickup_location / destination | VARCHAR | |
| pickup_lat, pickup_lng | FLOAT | geocoded |
| destination_lat, destination_lng | FLOAT | geocoded |
| status | ENUM | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| scheduled_start_time / scheduled_end_time | TIMESTAMP | |

### `maintenance_records`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| vehicle_id | INTEGER FK → vehicles | RESTRICT (never cascade-delete) |
| category | ENUM | Oil Change, Tyre Replacement, Brake Service, Engine Service, General Inspection |
| service_date | DATE | |
| next_service_date | DATE | optional |
| service_cost | FLOAT | INR, optional |
| service_provider | VARCHAR | optional |
| status | ENUM | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| notes | TEXT | optional |
| created_at | TIMESTAMP | auto |

### `maintenance_alerts`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| vehicle_id | INTEGER FK → vehicles | |
| maintenance_id | INTEGER FK → maintenance_records | |
| alert_message | VARCHAR | |
| alert_type | VARCHAR | |
| status | ENUM | PENDING, SENT, COMPLETED |
| generated_date | TIMESTAMP | auto |
| next_service_date | DATE | |

### `driver_assignments`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| driver_id | INTEGER FK → drivers | |
| vehicle_id | INTEGER FK → vehicles | |
| trip_id | INTEGER FK → trips | optional |
| assignment_date | DATE | |
| assignment_status | ENUM | ACTIVE, COMPLETED, CANCELLED |
| remarks | TEXT | optional |

### `driver_attendance`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| driver_id | INTEGER FK → drivers | |
| date | DATE | |
| attendance_status | VARCHAR | Present, Absent, Leave |
| check_in_time | TIMESTAMP | optional |
| check_out_time | TIMESTAMP | optional |

### `fuel_records`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| vehicle_id | INTEGER FK → vehicles | |
| driver_id | INTEGER FK → drivers | optional |
| fuel_quantity | FLOAT | Liters |
| fuel_cost | FLOAT | Cost |
| odometer_reading | FLOAT | optional |
| fuel_date | DATE | |
| fuel_station | VARCHAR | optional |
| remarks | TEXT | optional |
| created_at | TIMESTAMP | auto |


---

## API Reference

All endpoints except `/auth/login` and `/auth/register` require:
```
Authorization: Bearer <access_token>
```

### Authentication — `/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login → returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user profile |

### Vehicles — `/vehicles`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/vehicles` | List all vehicles |
| POST | `/vehicles` | Create a vehicle |
| GET | `/vehicles/{id}` | Get vehicle by ID |
| PUT | `/vehicles/{id}` | Update vehicle |
| DELETE | `/vehicles/{id}` | Delete vehicle |

### Drivers — `/drivers`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/drivers` | List all drivers |
| POST | `/drivers` | Create a driver |
| GET | `/drivers/{id}` | Get driver by ID |
| PATCH | `/drivers/{id}` | Update driver |
| DELETE | `/drivers/{id}` | Delete driver |

### Shipments — `/shipments`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/shipments` | List all shipments |
| POST | `/shipments` | Create a shipment |
| GET | `/shipments/{id}` | Get by ID |
| PUT | `/shipments/{id}` | Update (triggers WebSocket broadcast) |
| DELETE | `/shipments/{id}` | Delete |
| GET | `/shipments/{tracking_number}/status` | Public tracking by tracking number |

### Trips — `/trips`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/trips` | List all trips |
| POST | `/trips` | Schedule a trip (geocodes locations automatically) |
| GET | `/trips/{id}` | Get trip by ID |
| PUT | `/trips/{id}` | Update trip |
| DELETE | `/trips/{id}` | Delete trip |
| GET | `/trips/{id}/route` | OSRM route (distance, duration, polyline) |
| GET | `/trips/{id}/eta` | ETA calculation |

### Maintenance — `/maintenance`, `/maintenance-alerts`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/maintenance` | List records (filter: `vehicle_id`, `status`, `category`) |
| POST | `/maintenance` | Create a maintenance record |
| GET | `/maintenance/{id}` | Get record by ID |
| PUT | `/maintenance/{id}` | Update (auto-syncs vehicle status) |
| DELETE | `/maintenance/{id}` | Soft-cancel (history preserved forever) |
| GET | `/maintenance-alerts` | List all maintenance alerts |
| POST | `/maintenance-alerts` | Create maintenance alert manually |
| PUT | `/maintenance-alerts/{id}/status` | Update alert status |

### Driver Operations & Fuel — `/assignments`, `/attendance`, `/fuel`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/assignments` | Assign driver to vehicle/trip |
| GET | `/assignments` | View driver assignments |
| POST | `/attendance` | Mark driver attendance |
| GET | `/fuel` | List fuel records |
| POST | `/fuel` | Add fuel record |

### Real-time / Analytics
| Type | Endpoint | Description |
|---|---|---|
| WS | `/ws/tracking/{trip_id}` | Real-time GPS stream (connect via WebSocket) |
| GET | `/dashboard/fleet` | Aggregated fleet summary stats (dynamically computed) |
| GET | `/analytics/fuel` | Aggregated fuel metrics |
| GET | `/analytics/operations` | Aggregated delivery and trip performance metrics |
| GET | `/reports/maintenance` | Aggregated maintenance reports |
| GET | `/health/db` | Database connection health check |


#### WebSocket Message Types
```json
// On connect — initial snapshot
{ "event": "snapshot", "trip_id": 1, "status": "IN_PROGRESS",
  "pickup_location": "Delhi", "destination": "Mumbai",
  "lat": 28.7041, "lng": 77.1025, "clients_watching": 2 }

// Every 3 seconds — vehicle moves along real road waypoints
{ "event": "location_update", "trip_id": 1, "lat": 28.72, "lng": 77.13 }

// On shipment status change
{ "event": "status_update", "trip_id": 1,
  "tracking_number": "FLT100002", "status": "IN_TRANSIT" }
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repository
```bash
git clone https://github.com/springboardmentor553-maker/Fleet-Management-Logistics-Tracking-Platform.git
cd Fleet-Management-Logistics-Tracking-Platform
```

### 2. Set up Python virtual environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r FleetFlow/backend/requirements.txt
```

### 3. Configure environment
```bash
# Create .env inside the backend folder
cat > FleetFlow/backend/.env << EOF
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/fleetflow
SECRET_KEY=your-super-secret-key-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
EOF
```

### 4. Create the database & run migrations
```bash
# Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE fleetflow;"

# Run all migrations
cd FleetFlow/backend
alembic upgrade head
```

### 5. Seed sample data
```bash
cd /path/to/project-root
source .venv/bin/activate
python3 seed.py
```
This creates: 8 users, 6 vehicles, 5 drivers, 7 shipments, 6 trips.

### 6. Start the backend & Celery
```bash
# Terminal 1 - FastAPI
source .venv/bin/activate
cd FleetFlow/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Redis (Docker)
docker-compose up -d redis

# Terminal 3 - Celery Worker
source .venv/bin/activate
cd FleetFlow/backend
celery -A app.celery worker -l info

# Terminal 4 - Celery Beat
source .venv/bin/activate
cd FleetFlow/backend
celery -A app.celery beat -l info
```

### 7. Start the frontend
```bash
# Terminal 2
cd FleetFlow/frontend
npm install
npm run dev
```

### 8. Open in browser

| URL | Description |
|---|---|
| `http://localhost:5173` | FleetFlow Web App |
| `http://localhost:8000/docs` | Swagger API Documentation |
| `http://localhost:8000/redoc` | ReDoc API Documentation |
| `http://localhost:8000/health/db` | Database health check |

---

## Sample Users & Login Credentials

All sample users share the same password: **`FleetFlow@123`**

| Email | Password | Role | Access Level |
|---|---|---|---|
| `admin@fleetflow.in` | `FleetFlow@123` | **Admin** | Full access — all CRUD, user management |
| `manager@fleetflow.in` | `FleetFlow@123` | **Fleet Manager** | Manage vehicles, drivers, trips, shipments, maintenance |
| `dispatcher@fleetflow.in` | `FleetFlow@123` | **Dispatcher** | View and dispatch shipments |
| `ravi.kumar@fleetflow.in` | `FleetFlow@123` | **Driver** | View assigned trips and shipments |
| `priya.sharma@fleetflow.in` | `FleetFlow@123` | **Driver** | View assigned trips and shipments |
| `arjun.singh@fleetflow.in` | `FleetFlow@123` | **Driver** | View assigned trips and shipments |
| `neha.verma@fleetflow.in` | `FleetFlow@123` | **Driver** | View assigned trips and shipments |
| `suresh.rao@fleetflow.in` | `FleetFlow@123` | **Driver** | View assigned trips and shipments |

> **Recommended:** Start with `admin@fleetflow.in` to explore all features. Use `manager@fleetflow.in` for fleet operations. Driver accounts provide read-only access to their assigned trips.

### Role Permissions

| Feature | Admin | Fleet Manager | Dispatcher | Driver |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Vehicles — view | ✅ | ✅ | ✅ | ✅ |
| Vehicles — create/edit | ✅ | ✅ | ❌ | ❌ |
| Drivers — view | ✅ | ✅ | ✅ | ✅ |
| Drivers — create/edit | ✅ | ✅ | ❌ | ❌ |
| Shipments — view | ✅ | ✅ | ✅ | ✅ |
| Shipments — create/edit | ✅ | ✅ | ✅ | ❌ |
| Trips — all | ✅ | ✅ | ❌ | ❌ |
| Maintenance — all | ✅ | ✅ | ❌ | ❌ |
| Live Tracking | ✅ | ✅ | ✅ | ✅ |

---

## Project Structure

```
Fleet-Management-Logistics-Tracking-Platform/
├── FleetFlow/
│   ├── README.md                  ← You are here
│   ├── backend/
│   │   ├── alembic/
│   │   │   └── versions/          # Migration history (6 files)
│   │   ├── app/
│   │   │   ├── models/
│   │   │   │   ├── enums.py       # All enums (Role, Vehicle, Shipment, Trip, Maintenance)
│   │   │   │   ├── user.py
│   │   │   │   ├── driver.py
│   │   │   │   ├── vehicle.py
│   │   │   │   ├── shipment.py
│   │   │   │   ├── trip.py
│   │   │   │   └── maintenance.py # Milestone 3
│   │   │   ├── routers/
│   │   │   │   ├── auth.py
│   │   │   │   ├── vehicles.py
│   │   │   │   ├── drivers.py
│   │   │   │   ├── shipments.py   # Broadcasts WS on status update
│   │   │   │   ├── trips.py       # Geocoding + OSRM route + ETA
│   │   │   │   ├── maintenance.py # Milestone 3 — CRUD + vehicle sync
│   │   │   │   ├── tracking.py    # REST ETA + public shipment tracker
│   │   │   │   ├── ws_tracking.py # WebSocket — OSRM road-following simulation
│   │   │   │   └── dashboard.py
│   │   │   ├── services/
│   │   │   │   ├── directions.py  # OSRM route fetching
│   │   │   │   ├── geocoding.py   # Nominatim geocoding
│   │   │   │   ├── eta_service.py # ETA calculation
│   │   │   │   └── security.py    # JWT + password hashing + RBAC deps
│   │   │   ├── connection_manager.py  # WebSocket multi-client manager
│   │   │   ├── database.py
│   │   │   ├── config.py
│   │   │   └── main.py
│   │   └── requirements.txt
│   └── frontend/
│       ├── src/
│       │   ├── api/client.js      # Axios + all API bindings
│       │   ├── components/        # Sidebar, StatusBadge, ProtectedRoute
│       │   ├── context/AuthContext.jsx
│       │   └── pages/
│       │       ├── Login.jsx
│       │       ├── Register.jsx
│       │       ├── Dashboard.jsx
│       │       ├── Vehicles.jsx
│       │       ├── Drivers.jsx
│       │       ├── Shipments.jsx
│       │       ├── Trips.jsx
│       │       └── LiveTracking.jsx  # Leaflet + LRM + WebSocket
│       ├── index.html
│       └── package.json
├── seed.py                        # Seeds all sample data
├── verify.py                      # Health verification script
└── docker-compose.yml
```

---

## Environment Variables

`FleetFlow/backend/.env`:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/fleetflow

# JWT settings
SECRET_KEY=your-super-secret-key-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

---

## Milestones

### ✅ Milestone 1 — Weeks 1 & 2 (Complete)
Project initialization, system architecture, database schema, JWT auth, RBAC, fleet monitoring dashboard, vehicle and driver CRUD, Alembic migrations, PostgreSQL integration.

### ✅ Milestone 2 — Weeks 3 & 4 (Complete)
Shipment tracking, OSRM route optimization, Leaflet Routing Machine integration, ETA calculation, WebSocket real-time tracking with road-following GPS simulation, turn-by-turn directions, Trips scheduling UI, Live Tracking page with interactive map.

### ✅ Milestone 3 — Vehicle Maintenance (Complete)
Maintenance model, 5 predefined categories, full CRUD API, vehicle FK validation, automatic vehicle status sync, soft-delete history preservation, queryable filters.

### ✅ Milestone 4 — Driver Ops, Fuel & Background Tasks (Complete)
Driver Assignments, Driver Attendance, Fuel Monitoring records, fully dynamic aggregated analytics dashboard endpoints, dynamic metric computations for the current month. Complete web app responsive design for mobile and tablet compatibility.
Implemented Maintenance Alerts API, dynamic Maintenance Reports, and Celery + Redis background task integration for automated daily maintenance scheduling checks.

---

## Swagger API Docs

With the backend running, visit `http://localhost:8000/docs`

Endpoint groups:
- **auth** — Authentication & token management
- **vehicles** — Vehicle registration & status
- **drivers** — Driver profiles & assignment
- **shipments** — Shipment lifecycle (8 states)
- **trips** — Trip scheduling + OSRM routing + ETA
- **maintenance** — Maintenance records & vehicle sync
- **tracking** — ETA + public shipment status tracker
- **websocket** — Real-time GPS WebSocket endpoint
- **dashboard** — Fleet summary statistics

---

## License

MIT — see [LICENSE](../LICENSE)
