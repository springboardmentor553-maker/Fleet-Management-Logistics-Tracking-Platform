# FleetFlow – Logistics & Fleet Management Platform

A full-stack logistics and fleet management platform built with **FastAPI** (backend), **React + Vite** (frontend), **PostgreSQL**, **Redis**, and **Celery**. It supports real-time GPS tracking, route planning, ETA calculation, maintenance alerts, fuel monitoring, analytics, and role-based access control.

---

## Problem Statement

Modern fleet operations demand simultaneous visibility across vehicles, drivers, shipments, trips, and compliance requirements. FleetFlow addresses this by centralizing fleet operations into one integrated management platform with real-time capabilities.

---

## Major Features

| Feature | Description |
| :--- | :--- |
| **Authentication** | JWT-based login/registration with bcrypt password hashing |
| **Role-Based Access** | Admin, Fleet Manager, Dispatcher, Driver roles |
| **Vehicle Management** | Full CRUD for vehicles with status tracking |
| **Driver Management** | Driver profiles, availability, and status sync |
| **Driver Assignments** | Assign drivers to vehicles with conflict prevention |
| **Driver Attendance** | Attendance log with clock-in/clock-out |
| **Shipment Workflow** | Shipment lifecycle with status history tracking |
| **Trip Scheduling** | Conflict-detection trip scheduling with time validation |
| **Route Planning** | Geocoding via Nominatim + OSRM polyline routing |
| **ETA Calculation** | Real-time ETA with traffic level multipliers |
| **GPS/Location Tracking** | REST endpoint to push live vehicle coordinates |
| **WebSocket Real-time** | WebSocket broadcast of location & ETA updates per trip |
| **Maintenance Scheduling** | Maintenance record management per vehicle |
| **Maintenance Alerts** | Automated alert generation via Celery (daily schedule) |
| **Fuel Records** | Fuel consumption logging per vehicle/driver |
| **Analytics** | Fleet KPIs, fuel aggregations, maintenance reports |
| **Dashboard** | Summary metrics for Admin/Fleet Manager role |
| **Reports** | Filterable maintenance reports |
| **Background Jobs** | Celery worker + beat scheduler with Redis broker |

---

## User Roles

| Role | Access Level |
| :--- | :--- |
| **Admin** | Full access to all modules |
| **Fleet Manager** | Dashboard, Vehicles, Drivers, Maintenance, Trips, Analytics |
| **Dispatcher** | Drivers, Vehicles, Shipments, Assignments, Trips, Fuel, Analytics |
| **Driver** | Vehicles (read), Profile |

---

## Technology Stack

### Frontend
- React 18 (Vite)
- Axios (API requests)
- React Router v6
- React-Leaflet + OpenStreetMap (interactive route maps)
- Vanilla CSS (design system with dark mode support)

### Backend
- Python 3.12
- FastAPI
- SQLAlchemy 2.x ORM
- PostgreSQL (via psycopg2)
- Alembic (database migrations)
- JWT (python-jose) + bcrypt (passlib)
- WebSockets (FastAPI native)
- Celery 5 + Redis
- python-dotenv

---

## Project Structure

```
FleetFlow/
├── backend/
│   ├── Dockerfile
│   └── app/
│       ├── main.py            # FastAPI app entry point
│       ├── config.py          # Centralized settings (reads from .env)
│       ├── database.py        # SQLAlchemy engine & session
│       ├── celery.py          # Celery app + beat schedule
│       ├── dependencies.py    # JWT auth dependency
│       ├── role_checker.py    # Role-based route enforcement
│       ├── models/            # SQLAlchemy models
│       ├── schemas/           # Pydantic schemas
│       ├── routers/           # FastAPI route handlers
│       ├── services/          # Business logic (map_service)
│       └── utils/             # JWT handler
├── frontend/
│   ├── Dockerfile             # Multi-stage: Node build → Nginx serve
│   ├── nginx.conf             # SPA routing + API proxy
│   ├── vite.config.js         # Dev proxy configuration
│   └── src/
│       ├── components/        # Sidebar, Navbar, TripMap, etc.
│       ├── pages/             # Page components
│       ├── context/           # AuthContext
│       └── services/          # API service modules
├── alembic/
│   └── versions/              # Database migration scripts
├── docker-compose.yml
├── .env                       # Local environment variables (git-ignored)
├── .env.example               # Template with placeholder values
└── requirements.txt
```

---

## Database

- **Engine**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.x
- **Migrations**: Alembic

### Key Tables

| Table | Description |
| :--- | :--- |
| `users` | Authentication & role management |
| `vehicles` | Fleet vehicle registry |
| `drivers` | Driver profiles |
| `driver_assignments` | Vehicle-driver assignment records |
| `driver_attendance` | Driver attendance logs |
| `shipments` | Shipment lifecycle management |
| `shipment_history` | Shipment status change audit trail |
| `trips` | Trip scheduling with coordinate storage |
| `maintenance` | Vehicle maintenance scheduling |
| `maintenance_alerts` | Auto-generated maintenance alerts |
| `fuel_records` | Fuel consumption logs |

---

## Authentication

- **Registration**: `POST /register` — creates user with hashed password
- **Login**: `POST /login` — returns JWT access token
- **JWT**: Stored in `localStorage`, sent as `Authorization: Bearer <token>`
- **Protected Routes**: All API routes require a valid JWT via `get_current_user` dependency
- **Role Enforcement**: `role_required([...])` decorator restricts routes by role

---

## API Routes

| Module | Prefix | Key Operations |
| :--- | :--- | :--- |
| Auth | `/login`, `/register`, `/profile` | Login, register, profile fetch |
| Vehicles | `/vehicles` | CRUD + status |
| Drivers | `/drivers` | CRUD + status |
| Driver Assignments | `/driver-assignments` | Assign/list/delete |
| Driver Attendance | `/driver-attendance` | Clock-in/clock-out |
| Shipments | `/shipments` | CRUD + status history |
| Trips | `/trips` | CRUD + route + ETA + location + traffic + WebSocket |
| Maintenance | `/maintenance` | Schedule/track maintenance |
| Maintenance Alerts | `/maintenance-alerts` | CRUD alerts |
| Fuel Records | `/fuel-records` | Log/list fuel usage |
| Analytics | `/analytics` | Fleet KPIs + fuel stats |
| Reports | `/reports` | Maintenance reports |
| Dashboard | `/dashboard` | Summary metrics |

**Swagger UI**: `http://127.0.0.1:8000/docs`

---

## Local Setup

### Prerequisites
- Python 3.12
- Node.js 20+
- PostgreSQL 16
- Redis (optional — for Celery background jobs)

### 1. Clone & Setup Virtual Environment

```bash
cd C:\Users\admin\Desktop\FleetFlow
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy template and edit values
copy .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, etc.
```

### 3. Apply Database Migrations

```bash
alembic upgrade head
```

### 4. Start Backend

```bash
.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

**App URL**: `http://localhost:5173`

---

## Environment Variables

See `.env.example` for the full template:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `ALGORITHM` | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiry in minutes (default: `60`) |
| `REDIS_BROKER_URL` | Celery broker Redis URL |
| `REDIS_RESULT_BACKEND` | Celery result backend Redis URL |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins |

> `.env` is **git-ignored** — never commit real secrets.

---

## Celery Background Jobs

The `check_maintenance_schedules` task runs daily at midnight and auto-generates maintenance alerts for vehicles due for service within 7 days.

### Run Locally

```bash
# Worker
.\venv\Scripts\celery.exe -A backend.app.celery.celery_app worker --loglevel=info

# Beat Scheduler
.\venv\Scripts\celery.exe -A backend.app.celery.celery_app beat --loglevel=info
```

### Via Docker Compose
Celery worker and beat run as separate services (`celery_worker`, `celery_beat`) automatically.

---

## Docker Deployment

### Services

| Service | Description | Port |
| :--- | :--- | :--- |
| `frontend` | React app via Nginx | `80` |
| `backend` | FastAPI via Uvicorn | `8000` |
| `postgres` | PostgreSQL 16 | `5432` |
| `redis` | Redis 7 | `6379` |
| `celery_worker` | Celery task worker | — |
| `celery_beat` | Celery scheduler | — |

### Build & Start

```bash
# From project root
docker compose up --build
```

**App URL (Docker)**: `http://localhost:80`
**API URL (Docker)**: `http://localhost:8000`

### Stop
```bash
docker compose down
```

### Stop and remove volumes
```bash
docker compose down -v
```

---

## Testing & Validation

### Frontend Production Build
```bash
cd frontend
npm run build
# Expected: ✓ Built in ~1s, 0 errors
```

### Backend Syntax Check
```bash
.\venv\Scripts\python.exe -m py_compile backend/app/main.py backend/app/routers/*.py
```

### Docker Compose Validation
```bash
docker compose config
```

### API Testing
- Swagger UI: `http://127.0.0.1:8000/docs`
- All routes listed under their respective tags

---

## Troubleshooting

| Problem | Solution |
| :--- | :--- |
| Backend not running | Run `.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8000` |
| Frontend can't reach backend | Verify Vite proxy in `vite.config.js` points to `http://127.0.0.1:8000` |
| PostgreSQL connection error | Check `DATABASE_URL` in `.env`. Ensure PostgreSQL is running. |
| Redis unavailable | Install/start Redis. Celery requires Redis for task queue. |
| Celery worker not running | Start with `celery -A backend.app.celery.celery_app worker --loglevel=info` |
| CORS errors | Verify frontend origin is listed in `CORS_ORIGINS` in `.env` |
| Environment variable not loading | Ensure `.env` exists at project root, not inside `backend/` |
| JWT authentication failure | Confirm `SECRET_KEY` in `.env` matches what was used to issue existing tokens |
| Migration errors | Run `alembic upgrade head` from project root. Check `DATABASE_URL`. |

---

## Cloud Deployment

The project is fully containerized and Docker-ready for cloud deployment. Deployment to a cloud provider (AWS, GCP, Azure, Render, Railway, etc.) requires:

1. A cloud-hosted PostgreSQL database
2. A cloud Redis instance
3. Setting environment variables (`DATABASE_URL`, `SECRET_KEY`, `REDIS_BROKER_URL`, `CORS_ORIGINS`) in the cloud provider's environment configuration
4. Running `docker compose up --build` on the host (or using a managed container service)

> **Note**: No cloud deployment is currently active. The application is locally verified and Docker-ready.
