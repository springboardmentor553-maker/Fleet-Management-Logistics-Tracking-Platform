# FleetFlow – Logistics & Fleet Management Platform

## Project Overview
FleetFlow is a full-stack fleet management platform that helps logistics operators manage vehicles, drivers, shipments, trips, maintenance, and fuel consumption from a single system. It solves the problem of fragmented fleet operations by unifying trip scheduling, real-time GPS tracking, maintenance alerts, and operational analytics into one platform.

## Features
- **Authentication** – JWT-based login and protected routes
- **Fleet Management** – Vehicle registration, status tracking, capacity management
- **Driver Management** – Driver profiles, assignment, attendance, performance analytics
- **Shipment Tracking** – Full shipment lifecycle from creation to delivery
- **Trip Scheduling** – Trip creation linking shipments, drivers, and vehicles with validation
- **Route Planning & ETA** – Geocoding and route distance/duration via OpenRouteService
- **Real-Time Tracking** – WebSocket-based live vehicle location and shipment status broadcasting
- **Maintenance Management** – Scheduled maintenance, automatic status updates, service history
- **Maintenance Alerts** – Automatic alert generation with duplicate prevention
- **Fuel Monitoring** – Fuel record tracking and consumption analytics
- **Analytics & Dashboards** – Live operational, fuel, and maintenance reporting
- **Background Jobs** – Celery-based automated maintenance reminders

## Technology Stack
- **Frontend:** React, React Router, Recharts
- **Backend:** FastAPI
- **Database:** SQLite (dev), PostgreSQL-ready
- **ORM:** SQLAlchemy
- **Authentication:** JWT
- **Real-Time:** WebSockets
- **Background Jobs:** Celery + Redis
- **Maps/Routing:** OpenRouteService (geocoding + directions)
- **Containerization:** Docker, Docker Compose

## Architecture
- `app/models` – SQLAlchemy database models
- `app/schemas` – Pydantic request/response schemas
- `app/services` – Business logic and validation
- `app/routers` – FastAPI route definitions
- `frontend/src` – React application (pages, components, API client)

## Setup Instructions

### Backend
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Background Jobs
```bash
celery -A app.celery_app worker --loglevel=info --pool=solo
celery -A app.celery_app beat --loglevel=info
```

## Docker Deployment
```bash
docker-compose up --build
```

## API Documentation
Interactive API docs available at `/docs` once the backend is running.

## Environment Variables
See `.env.example` for required configuration (database URL, JWT secret, CORS origins, ORS API key).