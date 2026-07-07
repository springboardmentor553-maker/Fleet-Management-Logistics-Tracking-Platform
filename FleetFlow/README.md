# FleetFlow — Fleet Management & Logistics Tracking Platform

FleetFlow is a production-ready **FastAPI** backend for managing fleets of vehicles,
drivers, and logistics workflows. It covers JWT authentication with role-based access
control, vehicle registration, fleet monitoring, and driver management — all backed by
PostgreSQL with Alembic-managed migrations.

---

## Project Objectives & Logistics Workflows

### Objectives
- Centralise fleet operations: vehicle registration, assignment, and status tracking.
- Enforce role-based access so only authorised personnel can make sensitive changes.
- Provide a real-time dashboard giving a live count of the fleet by status.
- Lay the foundation for future shipment tracking and driver dispatch workflows.

### Core Logistics Workflows

```
1. USER REGISTRATION & AUTH
   └─ Register (role assigned) → Login → Receive JWT pair (access + refresh)
      └─ Access token used for all protected routes (30 min expiry)
      └─ Refresh token used to issue new access tokens (7 day expiry)

2. VEHICLE REGISTRATION
   └─ ADMIN / FLEET_MANAGER registers a vehicle (reg. number, type, capacity, fuel)
      └─ Vehicle starts with status: AVAILABLE
      └─ Status transitions: AVAILABLE ↔ IN_USE ↔ MAINTENANCE

3. DRIVER MANAGEMENT
   └─ ADMIN / FLEET_MANAGER creates a driver profile linked to a registered user
      └─ Driver profile stores license details
      └─ One user → One driver profile (enforced at DB + API level)

4. FLEET MONITORING
   └─ Any authenticated user can view the dashboard
      └─ Returns live counts: total, active (IN_USE), maintenance, available

5. SHIPMENT TRACKING (model defined, endpoints planned for next milestone)
   └─ Shipment links a driver + vehicle with pickup/delivery + ETA
      └─ Status: CREATED → ASSIGNED → IN_TRANSIT → DELIVERED / CANCELLED / DELAYED
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT (Future React UI)            │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP + JWT Bearer Token
┌─────────────────────▼───────────────────────────────┐
│              FastAPI Application Layer               │
│                                                     │
│  Routers          Services          Schemas         │
│  /auth      ───►  security.py  ◄── auth.py          │
│  /vehicles  ───►  (DB ops)     ◄── vehicle.py       │
│  /drivers   ───►               ◄── driver.py        │
│  /dashboard ───►               ◄── dashboard.py     │
└─────────────────────┬───────────────────────────────┘
                      │ SQLAlchemy ORM
┌─────────────────────▼───────────────────────────────┐
│              PostgreSQL Database                     │
│   users │ drivers │ vehicles │ shipments            │
└─────────────────────────────────────────────────────┘
```

### Layered Architecture

| Layer | Location | Responsibility |
|---|---|---|
| **Config** | `app/config.py` | Env-var settings (DB URL, JWT secrets, expiry) |
| **Database** | `app/database.py` | SQLAlchemy engine, session factory, `get_db()` dep |
| **Models** | `app/models/core.py` | ORM table definitions + enums |
| **Schemas** | `app/schemas/` | Pydantic request/response shapes + validation |
| **Services** | `app/services/security.py` | JWT creation/decode, password hashing, role dep |
| **Routers** | `app/routers/` | HTTP endpoints — thin, delegate to services |
| **Migrations** | `alembic/versions/` | Versioned DDL, reproducible schema rollout |

---

## Database Schema

### Enums
| Enum | Values |
|---|---|
| `RoleEnum` | `ADMIN`, `FLEET_MANAGER`, `DRIVER`, `DISPATCHER` |
| `VehicleStatusEnum` | `AVAILABLE`, `IN_USE`, `MAINTENANCE` |
| `ShipmentStatusEnum` | `CREATED`, `ASSIGNED`, `IN_TRANSIT`, `DELAYED`, `DELIVERED`, `CANCELLED` |

### Tables & Relationships

```
users (id PK, email UNIQUE, hashed_password, role)
  │  1:1
  ▼
drivers (id PK, user_id FK→users UNIQUE, license_details)
  │  1:M
  ▼
vehicles (id PK, registration_number UNIQUE, vehicle_type, capacity,
          fuel_type, current_status, manager_id FK→users, driver_id FK→drivers)
  │  1:M
  ▼
shipments (id PK, status, created_at, eta,
           driver_id FK→drivers, vehicle_id FK→vehicles)
```

---

## Project Structure

```
FleetFlow/
├── venv/                          # Python virtual environment
├── README.md
└── backend/
    ├── .env                       # Local secrets (gitignored)
    ├── alembic.ini
    ├── requirements.txt
    ├── alembic/
    │   ├── env.py
    │   └── versions/
    │       └── 53615c186099_initial_tables.py
    └── app/
        ├── main.py                # FastAPI app + router registration
        ├── config.py              # Settings from env vars
        ├── database.py            # Engine, session, get_db()
        ├── models/
        │   └── core.py            # User, Driver, Vehicle, Shipment ORM models
        ├── schemas/
        │   ├── auth.py            # Register/Login/Token/UserRead
        │   ├── vehicle.py         # VehicleCreate/Read/Update
        │   ├── driver.py          # DriverCreate/Read/Update
        │   └── dashboard.py       # DashboardSummary
        ├── routers/
        │   ├── auth.py            # POST /auth/register, /login, /refresh; GET /auth/me
        │   ├── vehicles.py        # CRUD /vehicles
        │   ├── drivers.py         # CRUD /drivers
        │   └── dashboard.py       # GET /dashboard
        ├── services/
        │   └── security.py        # JWT, bcrypt, get_current_user, require_roles
        └── utils/                 # Reserved for future helpers
```

---

## Setup & Running Locally

### Prerequisites
- Python 3.12+
- PostgreSQL running locally

### 1 — Create & activate the virtual environment
```bash
cd FleetFlow
python3 -m venv venv
source venv/bin/activate
```

### 2 — Install dependencies
```bash
pip install -r backend/requirements.txt
```

### 3 — Configure environment
Create `backend/.env` (never commit this):
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fleetflow_db

JWT_SECRET_KEY=change-this-in-production
JWT_REFRESH_SECRET_KEY=change-this-too-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 4 — Create the database
```bash
psql -U postgres -c "CREATE DATABASE fleetflow_db;"
```

### 5 — Apply migrations
```bash
cd backend
alembic upgrade head
```

### 6 — Start the server
```bash
uvicorn app.main:app --reload --port 8000
```

Swagger UI → **http://127.0.0.1:8000/docs**

---

## API Reference

### Auth — `/auth`
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/auth/register` | ❌ | — | Register a new user with a role |
| POST | `/auth/login` | ❌ | — | Login; returns access + refresh tokens |
| POST | `/auth/refresh` | ❌ | — | Exchange refresh token for new token pair |
| GET | `/auth/me` | ✅ JWT | Any | Get current user profile |

### Vehicles — `/vehicles`
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/vehicles` | ✅ JWT | ADMIN, FLEET_MANAGER | Register a new vehicle |
| GET | `/vehicles` | ✅ JWT | Any | List all vehicles |
| GET | `/vehicles/{id}` | ✅ JWT | Any | Get a single vehicle |
| PUT | `/vehicles/{id}` | ✅ JWT | ADMIN, FLEET_MANAGER | Full update of a vehicle |
| DELETE | `/vehicles/{id}` | ✅ JWT | ADMIN, FLEET_MANAGER | Remove a vehicle |

### Drivers — `/drivers`
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/drivers` | ✅ JWT | ADMIN, FLEET_MANAGER | Create driver profile for a user |
| GET | `/drivers` | ✅ JWT | Any | List all driver profiles |
| GET | `/drivers/{id}` | ✅ JWT | Any | Get a single driver profile |
| PATCH | `/drivers/{id}` | ✅ JWT | ADMIN, FLEET_MANAGER | Update license details |
| DELETE | `/drivers/{id}` | ✅ JWT | ADMIN only | Remove a driver profile |

### Dashboard — `/dashboard`
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/dashboard` | ✅ JWT | Any | Fleet summary counts by status |

**Sample dashboard response:**
```json
{
  "totalVehicles": 52,
  "active": 44,
  "maintenance": 3,
  "available": 5
}
```

---

## Roles & Permissions Summary

| Action | ADMIN | FLEET_MANAGER | DRIVER | DISPATCHER |
|---|---|---|---|---|
| Register / Login | ✅ | ✅ | ✅ | ✅ |
| View vehicles / drivers / dashboard | ✅ | ✅ | ✅ | ✅ |
| Create / Update vehicle | ✅ | ✅ | ❌ | ❌ |
| Delete vehicle | ✅ | ✅ | ❌ | ❌ |
| Create / Update driver profile | ✅ | ✅ | ❌ | ❌ |
| Delete driver profile | ✅ | ❌ | ❌ | ❌ |

---

## Milestone Completion Status

| Task | Status |
|---|---|
| ✅ Define project objectives & logistics workflows | Done — documented above |
| ✅ Design system architecture & database schema | Done — layered arch + 4-table schema |
| ⚠️ Create UI wireframes & operational workflow planning | Backend workflows documented; React frontend is **next milestone** |
| ⚠️ Setup React frontend | **Out of scope — Week 1 is backend-only** |
| ✅ Setup FastAPI backend | Done — running on uvicorn |
| ✅ Implement JWT auth & role-based access | Done — access + refresh tokens, 4 roles |
| ✅ Build fleet monitoring dashboard | Done — `GET /dashboard` |
| ✅ Develop vehicle registration workflows | Done — full CRUD with status transitions |
| ✅ Configure PostgreSQL integration | Done — SQLAlchemy + psycopg2 over TCP |
| ✅ Setup database migrations using Alembic | Done — `alembic upgrade head` applied |
