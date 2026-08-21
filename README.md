# FleetFlow – Logistics & Fleet Management Platform

## Project Overview

FleetFlow is a web-based logistics and fleet management platform designed to simplify and centralize fleet operations.

The platform helps fleet managers and administrators manage vehicles, drivers, shipments, maintenance schedules, fuel information, and fleet activities through a single application.

FleetFlow provides a React-based frontend and a FastAPI-based backend connected to a PostgreSQL database. It also uses JWT authentication and Celery background tasks for automated operations.

---

## Objectives

* Centralize fleet management operations.
* Manage vehicles and drivers efficiently.
* Manage and track shipments.
* Monitor vehicle fuel information.
* Manage vehicle maintenance schedules.
* Provide dashboard-based fleet analytics.
* Provide secure role-based authentication.
* Automate background maintenance checks.
* Provide APIs for fleet and logistics operations.

---

## Features

### Authentication

* User login
* JWT-based authentication
* Secure access tokens
* Role-based access control
* Protected API endpoints

### Fleet Management

* Add vehicles
* View vehicles
* Update vehicle information
* Delete vehicles
* Vehicle status monitoring
* Vehicle location information

### Driver Management

* Add drivers
* View drivers
* Update driver information
* Delete drivers
* Driver and shipment association

### Shipment Tracking

* Create shipments
* View shipments
* Update shipment information
* Delete shipments
* Source and destination management
* Shipment status
* Driver and vehicle assignment
* ETA information

### Trip Management

* Driver and vehicle assignment
* Shipment-based trip management
* Logistics workflow management

### Route Information

* Source and destination information
* Route-related shipment data
* Vehicle location support using latitude and longitude

### ETA

* Shipment Estimated Time of Arrival (ETA)
* ETA information available through shipment management

### Vehicle Tracking

* Vehicle latitude and longitude
* Vehicle location information
* Tracking-related API support

### Maintenance

* Vehicle maintenance management
* Maintenance schedule checking
* Automated background maintenance checks using Celery

### Fuel Monitoring

* Fuel type management
* Fuel level monitoring
* Fuel status
* Low-fuel vehicle identification

### Analytics Dashboard

The dashboard provides fleet statistics including:

* Total drivers
* Total vehicles
* Total shipments
* Delivered shipments
* Pending shipments
* Low-fuel vehicles

### Alerts and Background Tasks

Celery is used for background processing.

The system includes automated maintenance schedule checking through Celery background tasks.

---

# Technology Stack

## Frontend

* React
* Vite
* JavaScript
* HTML
* CSS

## Backend

* Python
* FastAPI
* Uvicorn

## Database

* PostgreSQL

## ORM

* SQLAlchemy

## Database Migration

* Alembic

## Authentication

* JWT

## Background Jobs

* Celery

## Message Broker

* Redis / Upstash Redis

## API Documentation

* FastAPI Swagger UI
* OpenAPI

## Containerization

* Docker
* Docker Compose

## Deployment

* Render

---

# System Architecture

```text
                    ┌───────────────────────┐
                    │        User           │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    React Frontend     │
                    │       + Vite          │
                    └───────────┬───────────┘
                                │
                         REST API Requests
                                │
                                ▼
                    ┌───────────────────────┐
                    │    FastAPI Backend    │
                    │                       │
                    │ Authentication        │
                    │ Fleet Management      │
                    │ Driver Management     │
                    │ Shipment Management   │
                    │ Dashboard             │
                    │ Maintenance           │
                    └───────┬───────┬───────┘
                            │       │
                ┌───────────┘       └────────────┐
                ▼                                ▼
       ┌──────────────────┐             ┌──────────────────┐
       │    PostgreSQL    │             │ Redis / Upstash  │
       │     Database     │             │      Redis       │
       └──────────────────┘             └────────┬─────────┘
                                                │
                                                ▼
                                      ┌──────────────────┐
                                      │  Celery Worker   │
                                      │ Background Jobs  │
                                      └──────────────────┘
```

---

# Database Architecture

FleetFlow uses PostgreSQL as its main database.

SQLAlchemy is used as the Object Relational Mapper (ORM), and Alembic is used to manage database migrations.

## Main Entities

### User

Stores application users and authentication information.

Main responsibilities:

* User authentication
* User roles
* Access control

### Driver

Stores driver information.

Drivers can be associated with shipments and fleet operations.

### Vehicle

Stores fleet vehicle information.

Vehicle information includes:

* Vehicle number
* Vehicle type
* Capacity
* Fuel type
* Fuel level
* Fuel status
* Latitude
* Longitude

### Shipment

Stores logistics shipment information.

Shipment information includes:

* Source
* Destination
* Shipment type
* Weight
* Status
* Driver
* Vehicle
* ETA

---

# API Documentation

The backend is developed using FastAPI and automatically provides interactive API documentation.

When running locally:

```text
http://localhost:8000/docs
```

ReDoc:

```text
http://localhost:8000/redoc
```

## Main API Operations

### Authentication

```text
POST /login
```

Used to authenticate users and generate JWT access tokens.

### Drivers

```text
POST   /drivers
GET    /drivers
PUT    /drivers/{driver_id}
DELETE /drivers/{driver_id}
```

### Vehicles

```text
POST   /vehicles
GET    /vehicles
PUT    /vehicles/{vehicle_id}
DELETE /vehicles/{vehicle_id}
```

### Shipments

```text
POST   /shipments
GET    /shipments
PUT    /shipments/{shipment_id}
DELETE /shipments/{shipment_id}
```

### Dashboard

The dashboard API provides fleet statistics and operational information.

---

# Project Structure

```text
FleetFlow/
│
├── alembic/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── tasks/
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── ...
│
├── screenshots/
│
├── docker-compose.yml
├── alembic.ini
├── render.yaml
├── requirements.txt
├── .gitignore
└── README.md
```

---

# Backend Setup

## Prerequisites

Install:

* Python 3.11+
* Node.js
* PostgreSQL
* Git
* Redis

## Clone Repository

```bash
git clone <repository-url>
cd FleetFlow
```

---

## Create Python Virtual Environment

```bash
python -m venv venv
```

Activate on Windows:

```bash
venv\Scripts\activate
```

---

## Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

# Environment Variables

Create a `.env` file and configure the required environment variables.

Example:

```env
DATABASE_URL=your_postgresql_database_url
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=your_redis_url
```

Sensitive values must not be committed to GitHub.

---

# Database Migration

Alembic is used for database schema migrations.

Create a migration:

```bash
alembic revision --autogenerate -m "update database"
```

Apply migrations:

```bash
alembic upgrade head
```

---

# Running the Backend

Run the FastAPI backend using:

```bash
python -m uvicorn backend.app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

Swagger documentation:

```text
http://localhost:8000/docs
```

---

# Running the Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

# Celery Background Jobs

FleetFlow uses Celery for background task processing.

Redis is used as the message broker.

```text
FastAPI
   │
   ▼
Redis / Upstash Redis
   │
   ▼
Celery Worker
   │
   ▼
Background Tasks
```

The application currently runs the **Celery Worker locally**, while Redis is hosted remotely.

One of the implemented background operations is maintenance schedule checking.

Example task:

```text
check_maintenance_schedule
```

The worker periodically processes the task and checks maintenance schedules.

For the current development setup, the Celery worker must be running locally for background tasks to execute.

Example:

```bash
celery -A app.celery_app worker --loglevel=info
```

The exact Celery command should match the Celery application module used in the project.

---

# Docker

Docker configuration is included in the project through:

```text
docker-compose.yml
```

Docker can be used to simplify running the required application services.

---

# Deployment

## Frontend

The React frontend is deployed separately from the backend.

The production frontend communicates with the deployed FastAPI backend through the configured API URL.

## Backend

The FastAPI backend is deployed as a cloud service.

Production configuration includes:

* Backend deployment
* Environment variables
* Database connection
* CORS configuration

## Database

PostgreSQL is used as the production database.

The database connection string is configured through environment variables.

## Redis

Redis is used as the message broker for Celery.

The current configuration uses a remotely hosted Redis service.

## Celery Worker

The Celery Worker is currently running locally.

For complete production deployment, the worker can be deployed separately as a cloud background worker service.

---

# CORS Configuration

CORS is configured in the FastAPI backend to allow communication between the frontend and backend.

For production, the deployed frontend URL must be included in the allowed origins.

```text
React Frontend
      │
      │ API Request
      ▼
FastAPI Backend
      │
      │ CORS Validation
      ▼
API Response
```

---

# Testing

## API Testing

API testing is performed using FastAPI Swagger UI.

Tested areas include:

* Authentication
* Driver APIs
* Vehicle APIs
* Shipment APIs
* Dashboard APIs
* Role-based access

## Workflow Testing

Major application workflows are tested across the frontend, backend, and database.

```text
Frontend
   ↓
FastAPI Backend
   ↓
PostgreSQL
```

Background processing is tested using:

```text
FastAPI
   ↓
Redis
   ↓
Celery Worker
   ↓
Background Task
```

## Validation

The application validates:

* Authentication
* Required API fields
* Database relationships
* Vehicle information
* Driver information
* Shipment information
* User roles
* Background task execution

---

# Application Status

| Component                      | Status      |
| ------------------------------ | ----------- |
| React Frontend                 | Completed   |
| FastAPI Backend                | Completed   |
| PostgreSQL Database            | Configured  |
| SQLAlchemy ORM                 | Implemented |
| Alembic Migrations             | Configured  |
| JWT Authentication             | Implemented |
| Driver Management              | Implemented |
| Vehicle Management             | Implemented |
| Shipment Management            | Implemented |
| Dashboard                      | Implemented |
| Fuel Monitoring                | Implemented |
| Maintenance Tasks              | Implemented |
| Celery                         | Implemented |
| Redis                          | Configured  |
| API Testing                    | Completed   |
| Workflow Testing               | Completed   |
| CORS                           | Configured  |
| Frontend Deployment            | Completed   |
| Backend Deployment             | Completed   |
| Production Database            | Configured  |
| Celery Worker Deployment       | Configured  |

---

# Performance and Optimization

The application follows a modular architecture to improve maintainability and reduce unnecessary code.

Optimization areas include:

* Reusable frontend components
* Modular FastAPI routers
* SQLAlchemy database operations
* Database migrations using Alembic
* Background processing using Celery
* Efficient API communication
* Environment-based configuration

---

# Security

FleetFlow uses:

* JWT authentication
* Role-based access control
* Protected API endpoints
* Environment variables for sensitive configuration
* CORS configuration
* Secure database configuration

Sensitive credentials such as database passwords, JWT secrets, and Redis credentials should never be committed to the repository.

---

# Future Enhancements

Future versions of FleetFlow can include:

* Cloud deployment of Celery Worker
* Advanced route optimization
* Improved real-time vehicle tracking
* WebSocket-based live updates
* Automated notification system
* Advanced maintenance scheduling
* More detailed analytics
* Automated CI/CD pipeline
* Increased automated test coverage
* Production monitoring

---

# Conclusion

FleetFlow provides a centralized platform for managing fleet and logistics operations.

The application integrates a React frontend, FastAPI backend, PostgreSQL database, SQLAlchemy ORM, Alembic migrations, JWT authentication, Redis, and Celery background processing.

The platform currently supports vehicle management, driver management, shipment management, dashboard analytics, fuel monitoring, maintenance scheduling, authentication, and background task processing.

The architecture also provides a foundation for future enhancements such as advanced route optimization, real-time tracking, automated alerts, and complete cloud-based background worker deployment.
