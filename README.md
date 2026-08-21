# FleetFlow – Logistics & Fleet Management Platform

FleetFlow is a web-based fleet management and logistics tracking platform developed as a group project. It brings vehicle management, driver management, shipments, trips, route planning, live tracking, maintenance, fuel monitoring, and analytics together in one application.

The project was developed to demonstrate the design, development, integration, testing, containerization, and cloud deployment of a modern full-stack fleet management system.

> **Project Status:** Working academic/project implementation
> **Live Demo:** https://fleetflow-frontend-jsqv.onrender.com

---

## Table of Contents

- [Overview](#overview)
- [Main Features](#main-features)
- [Screenshots](#screenshots)
- [How FleetFlow Works](#how-fleetflow-works)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Fleet and Driver Management](#fleet-and-driver-management)
- [Shipment and Trip Workflow](#shipment-and-trip-workflow)
- [Route Planning and ETA](#route-planning-and-eta)
- [Live Vehicle Tracking](#live-vehicle-tracking)
- [Maintenance and Fuel Management](#maintenance-and-fuel-management)
- [Analytics](#analytics)
- [Database and Migrations](#database-and-migrations)
- [Docker and Containerization](#docker-and-containerization)
- [Deployment](#deployment)
- [Demo Account](#demo-account)
- [Local Development](#local-development)
- [Testing](#testing)
- [Limitations and Future Development](#limitations-and-future-development)
- [Conclusion](#conclusion)

---

## Overview

FleetFlow is designed around a simple idea: fleet and logistics operations involve several connected processes. Vehicles and drivers need to be managed, shipments need to be assigned, trips need to be planned, routes need to be generated, vehicles need to be tracked, and operational information needs to be monitored.

FleetFlow combines these processes into a single web platform.

The application consists of a React frontend, a FastAPI backend, and a PostgreSQL database. The backend provides the application's APIs, authentication, business logic, database operations, route calculations, and real-time WebSocket communication. Docker is used to package the application, while Render is used for cloud deployment.

---

## Main Features

### Authentication

- User registration and login
- JWT-based authentication
- Password hashing
- Protected API endpoints
- Role-based access control
- Admin and Driver roles

### Fleet Management

- Vehicle registration and management
- Vehicle status tracking
- Vehicle-driver relationships
- Vehicle location information

### Driver Management

- Driver creation and management
- Driver availability
- Driver assignment
- Driver attendance
- Driver performance information

### Shipment Management

- Shipment creation and management
- Pickup and delivery locations
- Shipment status tracking
- Vehicle and driver relationships

### Trip Management

- Trip creation and scheduling
- Driver and vehicle assignment
- Trip status management
- Start and completion timestamps
- Route generation
- ETA calculation

### Live Tracking

- Real-time vehicle tracking using WebSockets
- Interactive map visualization
- Planned route display
- Vehicle coordinates
- Trip and shipment status updates
- Simulated movement along a planned route for active trips

### Maintenance

- Maintenance scheduling
- Vehicle maintenance status
- Maintenance history
- Maintenance alerts
- Duplicate alert prevention

### Fuel Management

- Fuel record creation
- Fuel calculations
- Fuel analytics

### Analytics

- Fleet dashboard
- Operational analytics
- Fuel analytics
- Maintenance information
- Shipment and trip information

---

# Screenshots

The following screenshots show the main parts of the deployed FleetFlow application.

## Dashboard

The dashboard provides an overview of fleet and operational information.

![FleetFlow Dashboard](images/dashboard.png)

## Analytics

The analytics section provides a higher-level view of fleet and operational information.

![FleetFlow Analytics](images/analytics.png)

## Vehicles

The vehicle management section is used to view and manage fleet vehicles.

![FleetFlow Vehicles](images/vehicles.png)

## Shipments

The shipment section displays shipment information and its current workflow state.

![FleetFlow Shipments](images/shipments.png)

## Trips

The trips section connects shipments with planned journeys and provides actions such as ETA calculation and live tracking.

![FleetFlow Trips](images/trips.png)

## Live Tracking

Live Tracking displays the planned route and vehicle position on an interactive map.

![FleetFlow Live Tracking](images/live-tracking.png)

---

# How FleetFlow Works

A typical FleetFlow workflow is:

```text
User Login
    ↓
Fleet / Driver Management
    ↓
Shipment Creation
    ↓
Vehicle & Driver Assignment
    ↓
Trip Creation
    ↓
Route Generation
    ↓
ETA Calculation
    ↓
Trip Started
    ↓
Live Vehicle Tracking
    ↓
Shipment Delivered
    ↓
Maintenance / Fuel Records
    ↓
Analytics & Dashboard
```

The modules are connected. For example, a shipment can be associated with a vehicle and driver, a trip can be created from that shipment, the trip can generate a route and ETA, and an active trip can then provide live tracking information.

---

# Technology Stack

## Frontend

- **React** – user interface and component-based application structure
- **Vite** – frontend development and production build tool
- **Axios** – communication with the backend API
- **React Leaflet / Leaflet** – interactive maps and route visualization

## Backend

- **Python** – backend programming language
- **FastAPI** – REST API and backend application framework
- **Uvicorn** – ASGI server for running FastAPI

## Database

- **PostgreSQL** – relational database
- **SQLAlchemy** – ORM and database interaction
- **Alembic** – database schema migrations

## Authentication and Security

- **JWT** – access-token based authentication
- **Passlib / password hashing** – secure password storage

## Mapping and Routing

- **OpenStreetMap** – map data/tiles
- **Leaflet** – map rendering
- **OpenRouteService (ORS)** – route generation, distance, and duration information

## Real-Time Communication

- **WebSockets** – real-time vehicle tracking updates

## Containerization and Deployment

- **Docker** – containerization
- **Nginx** – production serving of the React frontend
- **Render** – cloud deployment
- **Render PostgreSQL** – hosted production database

---

# System Architecture

FleetFlow follows a client-server architecture with a React frontend communicating with a FastAPI backend.

```text
                    ┌─────────────────────┐
                    │    FleetFlow User   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │       + Vite        │
                    └──────────┬──────────┘
                               │
                         HTTP / WebSocket
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │                     │
                    │ Authentication      │
                    │ Fleet Management    │
                    │ Shipments           │
                    │ Trips               │
                    │ Tracking            │
                    │ Maintenance         │
                    │ Fuel                │
                    │ Analytics           │
                    └───────┬─────┬───────┘
                            │     │
                    SQLAlchemy    │
                            │     │
                            ▼     ▼
                    ┌──────────┐ ┌──────────────────┐
                    │PostgreSQL│ │ OpenRouteService │
                    └──────────┘ └──────────────────┘
```

### Frontend Layer

The frontend handles the user interface, forms, dashboards, tables, authentication state, API requests, maps, and live tracking display.

### Backend Layer

The backend handles authentication, authorization, business logic, database operations, route generation, ETA calculations, REST endpoints, and WebSocket communication.

### Database Layer

PostgreSQL stores the application's persistent data. SQLAlchemy provides the database abstraction and Alembic manages schema changes.

---

# Project Structure

```text
Fleet-Management-Logistics-Tracking-Platform/
│
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── alembic/
│   │   └── versions/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
│
├── images/
│   ├── analytics.png
│   ├── dashboard.png
│   ├── live-tracking.png
│   ├── shipments.png
│   ├── trips.png
│   └── vehicles.png
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Authentication

FleetFlow uses JWT authentication to protect application functionality.

The basic flow is:

```text
User
 ↓
Login
 ↓
FastAPI verifies credentials
 ↓
Password hash verification
 ↓
JWT access token generated
 ↓
Frontend stores the access token
 ↓
Token is included with authenticated requests
 ↓
Backend validates the token
 ↓
Protected resource is accessed
```

Passwords are stored as hashes rather than plain-text passwords.

Role information is also included in the authentication flow so that application functionality can be restricted according to the user's role.

---

# Fleet and Driver Management

Vehicles and drivers form the core of the fleet management functionality.

Vehicles contain information such as registration details, vehicle type, status, driver assignment, and current location.

Drivers contain information related to availability, activity, attendance, assignments, and performance.

The application uses these relationships when determining which vehicles and drivers are available for new logistics operations.

---

# Shipment and Trip Workflow

FleetFlow connects shipments and trips into a larger logistics workflow.

A typical workflow is:

```text
Shipment Created
       ↓
Vehicle Available
       ↓
Driver Available
       ↓
Driver / Vehicle Assignment
       ↓
Trip Created
       ↓
Trip Scheduled
       ↓
Trip Started
       ↓
In Progress
       ↓
Shipment Delivered
       ↓
Trip Completed
```

This allows the different modules to work together instead of functioning as isolated pages.

---

# Route Planning and ETA

FleetFlow can generate a route using the pickup and delivery locations associated with a trip.

The backend communicates with OpenRouteService to obtain route information, including the planned route, distance, and estimated travel duration.

The application then uses this information to display:

- Route
- Distance
- Estimated travel duration
- Estimated arrival time (ETA)

The system is not limited to a fixed set of example locations. Routes can be generated between different locations supported by the routing service.

---

# Live Vehicle Tracking

Live Tracking uses WebSockets to provide real-time communication between the frontend and backend.

The basic process is:

```text
Trip Started
     ↓
Backend obtains planned route
     ↓
Vehicle position determined
     ↓
WebSocket connection established
     ↓
Backend sends vehicle coordinates
     ↓
Frontend receives coordinates
     ↓
Leaflet updates vehicle marker
     ↓
Vehicle continues along the route
```

For scheduled trips where a vehicle does not yet have a stored position, the beginning of the planned route can be used as the initial displayed position.

When a trip is active, the backend updates the vehicle position along the planned route and broadcasts the updated coordinates through the WebSocket connection.

---

# Maintenance and Fuel Management

## Maintenance

FleetFlow includes maintenance functionality for vehicle-related maintenance operations, including scheduling, status information, history, and maintenance alerts.

## Fuel

Fuel records can be added and used for calculations and analytics. This allows fuel-related information to be considered alongside other fleet information.

---

# Analytics

The dashboard and analytics modules provide a higher-level view of the available fleet and operational information.

Instead of requiring users to inspect every individual vehicle, driver, shipment, or trip, the application provides summarized information that can be used to understand the overall state of the fleet and its operations.

---

# Database and Migrations

PostgreSQL is the main relational database used by FleetFlow.

SQLAlchemy models represent the application's database entities and their relationships. Alembic manages changes to the database schema.

A typical migration workflow is:

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

Migration files are stored under:

```text
backend/alembic/versions/
```

---

# Docker and Containerization

FleetFlow includes Docker configuration for both the backend and frontend.

## Backend Docker Image

The backend image:

1. Uses a Python base image.
2. Installs the required dependencies from `requirements.txt`.
3. Copies the FastAPI application into the image.
4. Includes the Alembic configuration and migrations.
5. Runs FastAPI using Uvicorn.

## Frontend Docker Image

The frontend uses a multi-stage build:

1. A Node.js image installs dependencies and builds the React application.
2. The generated production build is copied into an Nginx image.
3. Nginx serves the production frontend.

A `docker-compose.yml` file is also included for running the configured services together during local containerized development.

---

# Deployment

The deployed FleetFlow platform uses **Render** as its cloud hosting platform.

### Backend

The FastAPI backend is deployed as a Docker-based Render Web Service.

The service receives its production configuration through environment variables and runs the containerized FastAPI application.

### Frontend

The React application is built into a production bundle and served through Nginx inside a Docker container on Render.

### Database

The production PostgreSQL database is hosted using Render's managed PostgreSQL service.

### Production Configuration

Environment variables are configured on the deployment platform instead of being committed to GitHub.

These include configuration for:

- PostgreSQL connection
- JWT secret
- JWT algorithm
- Access token expiry
- OpenRouteService API key
- Frontend API URL
- CORS

Sensitive credentials are intentionally excluded from the repository.

---

# Demo Account

A dedicated demo account is available for exploring the deployed application.

```text
Email:    demo@fleetflow.com
Password: password123
Role:     Admin
```

### Live Demo

https://fleetflow-frontend-jsqv.onrender.com

The demo account is intended only for project demonstration and uses dummy project data. It does not provide access to the GitHub repository, Render account, database credentials, or other infrastructure credentials.

---

# Local Development

## Prerequisites

- Python 3.12+
- Node.js
- npm
- PostgreSQL
- Git
- Docker (optional)

## Backend

```bash
cd backend
python -m venv venv
```

On Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure a backend `.env` file with the required environment variables:

```env
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ORS_API_KEY=your_ors_api_key
```

Run migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

The backend normally runs at `http://127.0.0.1:8000` and FastAPI's interactive documentation is available at `http://127.0.0.1:8000/docs`.

## Frontend

```bash
cd frontend
npm install
```

Create a frontend `.env` file:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

The frontend normally runs at `http://localhost:5173`.

## Docker

The application can also be run using Docker Compose:

```bash
docker compose up --build
```

---

# Testing

The completed platform was tested across the major application workflows, including:

- User registration and login
- JWT authentication
- Protected routes and role-based access
- Vehicle management
- Driver management
- Driver assignment and availability
- Shipment creation and workflow
- Trip creation and status changes
- Route generation
- ETA calculation
- WebSocket connection
- Live vehicle tracking
- Maintenance records and alerts
- Fuel records and analytics
- Dashboard and operational analytics
- End-to-end workflow validation
- Deployed frontend and backend communication

The deployed application was also tested using routes outside the original example locations to verify that route generation and ETA functionality were not restricted to a fixed set of locations.

---

# Limitations and Future Development

FleetFlow should be considered a **working academic/project implementation rather than a finished commercial fleet-management product**.

The main objective of the project was to build and demonstrate a complete full-stack platform covering the major requirements of the project milestones. The current version has the major modules integrated, has been tested, and is deployed as a working application.

However, turning the project into a commercial production system would require considerably more development, testing, security review, infrastructure work, and maintenance.

Possible future improvements include:

- More extensive input validation and error handling
- More comprehensive automated testing
- Better handling of edge cases
- Real GPS/device integration instead of route-based movement simulation
- More advanced routing and traffic information
- Production-grade monitoring and logging
- Rate limiting and abuse protection
- More granular permissions
- Additional security hardening
- More advanced analytics and reporting
- Improved scalability for larger fleets
- More extensive mobile support
- Further UI/UX improvements
- Additional database optimization
- Production-grade backup and recovery
- More comprehensive real-world operational workflows

There may still be smaller issues or edge cases in individual parts of the application. Not every possible improvement could realistically be completed within the scope and timeframe of the project, especially when developing a multi-module platform as a group.

The current version therefore represents a practical project milestone: the major features are implemented, the modules are integrated, the application has been tested, and the complete platform is deployed and accessible online. Further work would be expected before treating it as a commercial product.

---

# Conclusion

FleetFlow demonstrates the development of a complete full-stack logistics and fleet management platform.

The project combines React, Vite, FastAPI, Python, PostgreSQL, SQLAlchemy, Alembic, JWT authentication, WebSockets, Leaflet, OpenStreetMap, OpenRouteService, Docker, Nginx, and Render into one integrated system.

The resulting platform supports fleet and driver management, shipments, trips, route planning, ETA calculation, live vehicle tracking, maintenance, fuel records, and analytics.

Although further development would be required for commercial use, the current implementation provides a complete working project demonstrating the design, development, integration, testing, containerization, and deployment of a modern fleet management application.

---

## Repository

https://github.com/ithsro/Fleetflow
