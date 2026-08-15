# DOCKER SETUP

## Prerequisites
- Docker Engine / Docker Desktop must be installed and running on the host system.
- Docker CLI must be available in the system PATH.

## Environment Variables
Create `.env` files in both the `backend/` and `frontend/` directories. You can use the provided `.env.example` templates.
- **Backend**: `DATABASE_URL` (pointing to the `postgres` docker service) and `FRONTEND_URL` (for CORS).
- **Frontend**: `VITE_API_URL` and `VITE_WS_URL`.

## Build Commands
Run the following commands from the root of the repository:
```bash
docker compose config
docker compose build
```

## Startup Commands
```bash
docker compose up -d
```

## Shutdown Commands
```bash
docker compose down
```

## Logs
```bash
docker compose logs postgres
docker compose logs backend
docker compose logs frontend
```

## Database Migration
Once the stack is running, apply Alembic migrations against the Dockerized PostgreSQL instance (do NOT run this against your local dev DB):
```bash
docker compose exec backend alembic upgrade head
```

## URLs
- **Backend API**: `http://localhost:8000`
- **Frontend App**: `http://localhost`

## Troubleshooting
- If the backend fails to connect to PostgreSQL, ensure the `DATABASE_URL` uses the `postgres` service name and not `localhost`.
- If the frontend cannot communicate with the backend, verify `VITE_API_URL` is set to `http://localhost:8000` (browser perspective).

## Resetting the Docker Database Safely
If you need to wipe the Docker database and start fresh, run:
```bash
docker compose down -v
```
*(This safely removes the Docker volumes without touching your local development database).*
