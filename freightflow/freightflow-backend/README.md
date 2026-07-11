# FreightFlow Backend — Fleet Operations & Logistics API

Original FastAPI implementation for fleet, driver, shipment, route, maintenance,
and live-tracking management, built with a module-per-domain architecture.

## Stack
FastAPI · SQLAlchemy 2.0 · PostgreSQL · Alembic · Pydantic v2 · JWT (python-jose) · passlib(bcrypt)

## Setup

```bash
cd freightflow-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # edit DATABASE_URL / JWT_SECRET_KEY

alembic revision --autogenerate -m "initial schema"
alembic upgrade head

uvicorn app.main:app --reload
```

- API root: http://127.0.0.1:8000
- Swagger UI: http://127.0.0.1:8000/docs

## Testing

The test suite uses an in-memory SQLite DB (via dependency override) so it
runs without a real Postgres instance — useful for CI or quick local checks.
Business logic is identical to what runs against Postgres.

```bash
pip install -r requirements.txt   # includes pytest + httpx
pytest
```

Covers: auth (login, role guards), vehicle CRUD + uniqueness constraints, the
full shipment lifecycle (pending → assigned → in_transit → delivered, plus
cancel), driver availability state transitions, tracking pings, and the
dashboard/reports endpoints.

## Module layout

Each business domain (`accounts`, `fleet`, `drivers`, `shipments`, `routes_ops`,
`maintenance`, `tracking`, `notifications`) is self-contained with its own
`models.py`, `schemas.py`, `service.py`, and `router.py`. `dashboard` and
`reporting` are read-only aggregation modules that query across domains.

## Roles
- `admin` — full access, user management
- `dispatcher` — manages vehicles, drivers, shipments, routes, maintenance
- `driver` — read access + own profile, feeds tracking pings

## Core workflow
1. Admin creates driver accounts (`POST /api/v1/accounts`) and driver profiles (`POST /api/v1/drivers`)
2. Dispatcher registers vehicles (`POST /api/v1/vehicles`)
3. Dispatcher creates a shipment (`POST /api/v1/shipments`), plans a route (`POST /api/v1/routes`)
4. Dispatcher assigns vehicle + driver (`POST /api/v1/shipments/{id}/assign`)
5. Shipment moves through `in-transit` → `deliver` as the trip progresses
6. Vehicle/device pushes GPS pings (`POST /api/v1/tracking/ping`) during transit
7. Dashboard and reports expose live KPIs and historical analytics
