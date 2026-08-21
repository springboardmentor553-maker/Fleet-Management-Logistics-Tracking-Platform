# 🏗️ FleetFlow — System Architecture

## Architectural Overview

FleetFlow follows a **layered, microservice-ready monolithic architecture** with clear separation of concerns. It is structured as a full-stack web application with a REST + WebSocket backend, a SPA frontend, a relational database, and asynchronous task processing.

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    React 19 + Vite 8 SPA                     │  │
│   │                                                               │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│   │  │ Dashboard│  │ LiveMap  │  │ Drivers  │  │ Maintenance │  │  │
│   │  │ (Stats)  │  │ (WebSocket│  │ (CRUD)  │  │ (Alerts)    │  │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │  │
│   │                                                               │  │
│   │  Axios (HTTP) ◄──────────────────────────────────────────    │  │
│   │  WebSocket Client ◄─────────────────────────────────────     │  │
│   └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │ HTTP/S (REST)
                              │ ws:// (WebSocket)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                    FastAPI Application                         │ │
│   │                                                               │ │
│   │  ┌─────────────────────────────────────────────────────────┐ │ │
│   │  │                  Middleware                              │ │ │
│   │  │  CORS Middleware │ JWT Auth │ Role Enforcement (RBAC)   │ │ │
│   │  └─────────────────────────────────────────────────────────┘ │ │
│   │                                                               │ │
│   │  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐   │ │
│   │  │  Routers   │  │   Services   │  │     Schemas        │   │ │
│   │  │ (21 modules)│  │ (Business   │  │  (Pydantic I/O)    │   │ │
│   │  │            │  │  Logic)      │  │                    │   │ │
│   │  └─────┬──────┘  └──────┬───────┘  └────────────────────┘   │ │
│   │        │                │                                    │ │
│   │  ┌─────▼────────────────▼─────────────────────────────────┐ │ │
│   │  │              SQLAlchemy ORM Layer                       │ │ │
│   │  │  Models: User, Driver, Vehicle, Shipment, Trip,        │ │ │
│   │  │          Fuel, Maintenance, Alert, Notification        │ │ │
│   │  └─────────────────────────────────────────────────────────┘ │ │
│   │                                                               │ │
│   │  WebSocket Manager (connection_manager.py)                   │ │
│   │  GPS Simulation Thread (auto-starts on startup)              │ │
│   └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼──────────────────┐
              ▼               ▼                  ▼
┌─────────────────┐  ┌──────────────┐  ┌─────────────────────┐
│  DATA LAYER     │  │  CACHE/MSG   │  │  ASYNC TASK LAYER   │
│                 │  │    LAYER     │  │                     │
│  PostgreSQL 16  │  │  Redis 7     │  │  Celery Workers     │
│  ─────────────  │  │  ─────────── │  │  ─────────────────  │
│  Primary store  │  │  • Task      │  │  • maintenance      │
│  for all data   │  │    broker    │  │    reminders        │
│  10 tables      │  │  • Result    │  │  • Celery Beat      │
│                 │  │    backend   │  │    (scheduler)      │
└─────────────────┘  └──────────────┘  └─────────────────────┘
```

---

## Component Architecture

### Backend — FastAPI Application

```
Backend/
└── app/
    ├── main.py              ← App entry point, router registration, startup hooks
    ├── config.py            ← Pydantic Settings (env vars)
    ├── database.py          ← SQLAlchemy engine, Base, init_db()
    ├── connection_manager.py← WebSocket + GPS simulation manager
    ├── celery_app.py        ← Celery configuration
    │
    ├── models/              ← SQLAlchemy ORM models (database tables)
    │   ├── user.py
    │   ├── driver.py
    │   ├── driver_extended.py
    │   ├── vehicle.py
    │   ├── shipment.py
    │   ├── trip.py
    │   ├── fuel.py
    │   ├── maintenance.py
    │   ├── maintenance_alert.py
    │   ├── notification.py
    │   └── driver_assignment.py
    │
    ├── routers/             ← FastAPI route handlers (21 modules)
    │   ├── auth.py          ← Register, Login, /me
    │   ├── admin.py         ← User CRUD (Admin only)
    │   ├── fleet.py         ← Vehicle CRUD
    │   ├── drivers.py       ← Driver management (Admin/Fleet/Dispatcher)
    │   ├── driver.py        ← Driver self-service (own shipments)
    │   ├── dispatcher.py    ← Shipment creation & assignment
    │   ├── dashboard.py     ← KPI stats aggregation
    │   ├── shipment.py      ← Extended shipment ops
    │   ├── trip.py          ← Trip CRUD & management
    │   ├── gps.py           ← Location updates + WebSocket
    │   ├── route.py         ← Route management
    │   ├── maintenance.py   ← Maintenance records CRUD
    │   ├── maintenance_alert.py ← Alert CRUD & acknowledgment
    │   ├── fuel.py          ← Fuel records CRUD
    │   ├── driver_assignment.py ← Assignment operations
    │   ├── attendance.py    ← Driver attendance tracking
    │   ├── analytics.py     ← Fuel & operational analytics
    │   ├── notifications.py ← Notification management
    │   ├── reports.py       ← Summary reports
    │   └── reports_export.py← PDF & Excel export
    │
    ├── schemas/             ← Pydantic request/response models
    ├── services/            ← Business logic (maps, calculations)
    ├── tasks/               ← Celery background tasks
    └── utils/
        ├── security.py      ← bcrypt hashing + JWT creation/validation
        ├── dependencies.py  ← get_db, get_current_user
        └── roles.py         ← Role enum + require_roles() factory
```

### Frontend — React Application

```
Frontend/
└── src/
    ├── main.jsx             ← React entry point
    ├── App.jsx              ← App shell, routing, sidebar navigation
    ├── App.css              ← Global styles (dark fleet theme, 53KB)
    │
    ├── api/                 ← API layer (Axios wrappers)
    │   └── axios.js         ← Configured Axios instance (auth interceptor)
    │
    └── components/          ← UI components (18 pages)
        ├── Login.jsx             ← Authentication form
        ├── Dashboard.jsx         ← KPI cards, fleet overview
        ├── AdminDashboard.jsx    ← Admin-specific stats
        ├── FleetManagerDashboard.jsx
        ├── DispatcherDashboard.jsx
        ├── DriverDashboard.jsx
        ├── Vehicles.jsx          ← Vehicle CRUD table + modals
        ├── Drivers.jsx           ← Driver management
        ├── DriverAssignment.jsx  ← Assignment management
        ├── LiveMap.jsx           ← Real-time GPS map (27KB)
        ├── Shipments.jsx         ← Shipment management
        ├── Trips.jsx             ← Trip monitoring
        ├── Maintenance.jsx       ← Maintenance records
        ├── MaintenanceAlerts.jsx ← Alert management
        ├── Fuel.jsx              ← Fuel logging
        ├── Notifications.jsx     ← Notification center
        ├── ReportsExport.jsx     ← PDF/Excel report downloads
        └── StatCard.jsx          ← Reusable KPI card component
```

---

## Security Architecture

```
Request → CORS Check → JWT Validation → Role Check → Handler → Response
             │              │                │
          (Block)       (401 Error)      (403 Error)
```

### JWT Token Flow

```
1. POST /auth/login  →  validate credentials  →  generate JWT
2. JWT payload: { sub: email, role: "admin", exp: timestamp }
3. All requests: Authorization: Bearer <token>
4. get_current_user() dependency decodes & validates on every request
5. require_roles() checks role claim against allowed roles
```

### Password Security

- Passwords hashed with **bcrypt** (cost factor default)
- Raw passwords never stored or logged
- Comparison done via `bcrypt.checkpw()` (timing-safe)

---

## WebSocket Architecture

```
GPS Simulation Thread (background)
    │
    │ Every 2 seconds: move each vehicle's lat/lng slightly
    │
    ▼
app.connection_manager.manager.broadcast()
    │
    ├──► WebSocket client 1 (LiveMap tab, browser 1)
    ├──► WebSocket client 2 (LiveMap tab, browser 2)
    └──► WebSocket client N ...

Endpoints:
  ws://localhost:8000/ws/tracking/{trip_id}  → per-trip tracking
  ws://localhost:8000/gps/ws/locations       → all-vehicle feed
```

---

## Deployment Architecture (Docker Compose)

```
┌─────────────────────────────────────────────────────┐
│                 Docker Network                       │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  frontend    │    │  backend (FastAPI)        │   │
│  │  :5173 → :80 │    │  :8000                   │   │
│  │  nginx.conf  │    │  uvicorn app.main:app     │   │
│  └──────┬───────┘    └──────────────────┬────────┘   │
│         │                               │            │
│         │ API calls                     │            │
│         └───────────────────────────────┘            │
│                                                      │
│  ┌───────────────┐  ┌────────────────────────────┐   │
│  │  postgres:16  │  │  redis:7                   │   │
│  │  :5433 → :5432│  │  :6379                     │   │
│  │  healthcheck  │  │                            │   │
│  └───────────────┘  └────────────────────────────┘   │
│                                                      │
│  ┌────────────────┐  ┌──────────────────────────┐    │
│  │  celery-worker │  │  celery-beat             │    │
│  │  (tasks)       │  │  (scheduler)             │    │
│  └────────────────┘  └──────────────────────────┘    │
│                                                      │
│  Volume: postgres_data (persistent)                  │
└─────────────────────────────────────────────────────┘
```

**Services Summary:**

| Container | Image | Port | Purpose |
|---|---|---|---|
| `fleetflow-postgres` | postgres:16 | 5433:5432 | Primary database |
| `fleetflow-redis` | redis:7 | 6379 | Celery broker |
| `fleetflow-backend` | fleetflow-backend:latest | 8000 | FastAPI app |
| `fleetflow-celery-worker` | fleetflow-backend:latest | — | Background tasks |
| `fleetflow-celery-beat` | fleetflow-backend:latest | — | Task scheduler |
| `fleetflow-frontend` | fleetflow-frontend:latest | 5173:80 | React app via nginx |

---

## Cross-Cutting Concerns

| Concern | Implementation |
|---|---|
| **Logging** | FastAPI default logging + uvicorn access logs |
| **Error Handling** | FastAPI `HTTPException` with proper status codes |
| **CORS** | CORSMiddleware configured for localhost:5173/5174 |
| **Database Sessions** | SQLAlchemy `SessionLocal` with `get_db()` dependency |
| **Configuration** | Pydantic `BaseSettings` reading from `.env` |
| **Schema Validation** | Pydantic v2 for all request/response bodies |
| **Migrations** | Alembic with autogenerate support |

---

*Document Version: 1.0 | Project: FleetFlow | Organization: Infosys Internship*
