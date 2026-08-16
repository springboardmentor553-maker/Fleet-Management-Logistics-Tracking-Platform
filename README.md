# FleetFlow — Fleet Management Logistics Tracking Platform

FleetFlow is a full-stack **Fleet Management and Logistics Tracking Platform** designed to help organizations manage vehicles, drivers, shipments, trips, fuel consumption, maintenance schedules, alerts, and real-time fleet operations from a centralized dashboard.

The platform provides role-based access for **Administrators, Fleet Managers, Drivers, and Dispatchers**, with a RESTful FastAPI backend, React frontend, PostgreSQL database, Redis, Celery background processing, and Docker-based deployment.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization

* JWT-based authentication
* Secure login and user management
* Role-based access control
* Supported roles:

  * Admin
  * Fleet Manager
  * Dispatcher
  * Driver
* Protected API endpoints
* User profile and authentication validation

### 🚛 Vehicle Management

* Register and manage fleet vehicles
* Vehicle type and model information
* Capacity management
* Fuel type tracking
* Vehicle availability/status tracking
* Driver assignment
* Vehicle location tracking
* Vehicle health and maintenance information

### 👨‍✈️ Driver Management

* Driver registration and management
* License and contact information
* Driver availability tracking
* Driver attendance management
* Leave/absence tracking
* Safety score
* Driver rating
* Completed trip statistics
* Driver performance analytics
* Driver activity logs

### 📦 Shipment Management

* Create and manage shipments
* Origin and destination tracking
* Shipment weight tracking
* Shipment status management
* Driver and vehicle assignment
* Delivery status monitoring

### 🛣️ Trip Management

* Create and schedule trips
* Assign vehicles and drivers
* Trip status tracking
* Start and complete trips
* Driver availability validation
* Vehicle availability validation
* Prevention of invalid active assignments
* Completed trip tracking

### 📍 GPS & Real-Time Tracking

* Real-time trip tracking
* WebSocket-based tracking
* Vehicle latitude and longitude
* Live map visualization
* Route estimation
* Distance calculation
* ETA-related tracking functionality

### ⛽ Fuel Monitoring

* Add fuel records
* Edit fuel records
* Delete fuel records
* Track fuel quantity
* Track fuel cost
* Track odometer readings
* Fuel station information
* Fuel date and remarks
* Total fuel consumption analytics
* Total fuel cost analytics
* Average fuel consumption
* Highest fuel usage vehicle
* Lowest fuel usage vehicle

### 🔧 Maintenance Management

* Schedule vehicle maintenance
* Track maintenance records
* Start maintenance
* Complete maintenance
* Upcoming maintenance tracking
* Overdue maintenance tracking
* Vehicle health reports

### 🚨 Maintenance Alerts

Automated maintenance alerts are generated based on maintenance schedules.

Supported alert types include:

* `service_due`
* `upcoming`
* `overdue`
* `health_critical`

Alert statuses include:

* `Pending`
* `Sent`
* `Completed`

Duplicate maintenance alerts are prevented.

### 🔔 Notifications

The platform supports notifications for important fleet events, including:

* Maintenance alerts
* Delivery updates
* Driver assignments
* Shipment status changes
* Route changes
* Email notifications
* SMS notifications
* Push notifications

### 📊 Dashboard & Analytics

The dashboard provides fleet-level operational information including:

* Vehicle statistics
* Driver statistics
* Shipment statistics
* Trip statistics
* Fuel analytics
* Driver performance analytics
* Maintenance information
* Fleet activity

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │     Frontend         │
                    │      Port 5173       │
                    └──────────┬───────────┘
                               │
                         REST / WebSocket
                               │
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │       Backend        │
                    │      Port 8000       │
                    └───────┬───────┬──────┘
                            │       │
                ┌───────────┘       └────────────┐
                ▼                                ▼
       ┌─────────────────┐              ┌─────────────────┐
       │   PostgreSQL    │              │      Redis      │
       │    Database     │              │ Message Broker  │
       │     Port 5433   │              │    Port 6379    │
       └─────────────────┘              └────────┬────────┘
                                                 │
                                      ┌──────────┴──────────┐
                                      ▼                     ▼
                              ┌───────────────┐     ┌───────────────┐
                              │ Celery Worker │     │ Celery Beat   │
                              │ Background    │     │ Scheduled     │
                              │ Tasks         │     │ Tasks         │
                              └───────────────┘     └───────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* React Leaflet
* Axios
* Vite

## Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* JWT Authentication
* WebSockets
* Alembic

## Database

* PostgreSQL

## Background Processing

* Celery
* Redis

## Deployment & Infrastructure

* Docker
* Docker Compose
* Nginx

## Development Tools

* Visual Studio Code
* Git
* GitHub
* Postman
* Swagger / OpenAPI

---

# 👥 User Roles

| Role              | Main Responsibilities                                           |
| ----------------- | --------------------------------------------------------------- |
| **Admin**         | Manage users, fleet, drivers, vehicles, system-level operations |
| **Fleet Manager** | Manage vehicles, drivers, maintenance, fuel and fleet analytics |
| **Dispatcher**    | Manage shipments, trips, driver and vehicle assignments         |
| **Driver**        | View assigned trips and participate in fleet operations         |

Role-based authorization is enforced at the backend API level.

---

# 📦 Main Modules

```text
FleetFlow
│
├── Authentication
├── User Management
├── Dashboard
├── Vehicle Management
├── Driver Management
├── Driver Attendance
├── Driver Analytics
├── Shipment Management
├── Trip Management
├── Driver Assignment
├── GPS Tracking
├── Route Estimation
├── Fuel Monitoring
├── Fuel Analytics
├── Maintenance Management
├── Maintenance Alerts
├── Notifications
└── Background Tasks
```

---

# 🔄 Core FleetFlow Workflow

```text
User Login
    │
    ▼
Dashboard
    │
    ├── Register Vehicle
    │
    ├── Register Driver
    │
    ├── Create Shipment
    │
    ├── Schedule Trip
    │
    ├── Assign Driver + Vehicle
    │
    ├── Track Trip
    │
    ├── Complete Delivery
    │
    ├── Add Fuel Record
    │
    └── Schedule Maintenance
              │
              ▼
       Celery Scheduled Task
              │
              ▼
       Maintenance Alert
              │
              ▼
          Notification
```

---

# 🧠 Business Rule Validation

FleetFlow includes validation rules to prevent invalid fleet operations.

### Vehicle Validation

* Vehicle must exist before assignment.
* Vehicles under maintenance cannot be assigned to active trips.
* Vehicle availability is checked before assignment.

### Driver Validation

* Driver must exist before assignment.
* Drivers on leave cannot be assigned.
* Drivers already assigned to an active trip cannot receive another active trip.
* Driver availability is updated according to trip assignments.

### Fuel Validation

* Vehicle must exist.
* Driver must exist.
* Fuel quantity must be greater than zero.
* Fuel cost must be greater than zero.

### Maintenance Validation

* Vehicle must exist.
* Maintenance schedules are tracked by date.
* Upcoming maintenance can generate alerts.
* Overdue maintenance can generate alerts.
* Duplicate pending maintenance alerts are prevented.

---

# ⏰ Automated Maintenance Processing

FleetFlow uses **Celery + Redis** for background maintenance processing.

The scheduled task checks maintenance records and determines whether:

1. A service is approaching.
2. A service is due today.
3. A maintenance schedule is overdue.
4. An alert already exists.

If an appropriate alert does not already exist, FleetFlow creates the maintenance alert and notification.

Example:

```text
Maintenance Schedule
       │
       ▼
Celery Beat
       │
       ▼
Celery Worker
       │
       ▼
Check Maintenance Records
       │
       ├── Upcoming → Alert
       ├── Due Today → Alert
       └── Overdue → Alert
                    │
                    ▼
              Notification
```

---

# 📡 API Documentation

The backend exposes REST APIs through FastAPI.

Once the application is running, Swagger UI is available at:

```text
http://localhost:8000/docs
```

OpenAPI specification:

```text
http://localhost:8000/openapi.json
```

The API is organized into modules such as:

```text
/auth
/users
/admin
/dashboard
/vehicles
/drivers
/shipments
/trips
/fuel
/maintenance
/notifications
/route
/ws/tracking
```

---

# 🗄️ Database

FleetFlow uses PostgreSQL as its primary relational database.

Major entities include:

```text
User
Driver
Vehicle
Shipment
Trip
FuelRecord
MaintenanceRecord
MaintenanceAlert
Notification
DriverAttendance
DriverActivityLog
```

Relationships between entities are managed using SQLAlchemy ORM and foreign keys.

Database migrations are handled using Alembic.

---

# 🐳 Docker Services

FleetFlow is containerized using Docker Compose.

The project contains the following services:

| Service         | Purpose                                |
| --------------- | -------------------------------------- |
| `backend`       | FastAPI application                    |
| `frontend`      | React application served through Nginx |
| `postgres`      | PostgreSQL database                    |
| `redis`         | Celery message broker                  |
| `celery-worker` | Executes background tasks              |
| `celery-beat`   | Schedules periodic tasks               |

Check running services:

```bash
docker compose ps
```

---

# ⚙️ Environment Configuration

Sensitive environment variables are intentionally **not committed** to the repository.

Create your local `.env` file from the provided example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then update the values in `.env`.

Example:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

> Never commit your real `.env` file or API keys to GitHub.

The repository includes:

```text
.env.example
```

for configuration reference.

---

# ▶️ Running the Project

## 1. Clone the repository

```bash
git clone https://github.com/springboardmentor553-maker/Fleet-Management-Logistics-Tracking-Platform.git
```

Move into the project directory:

```bash
cd Fleet-Management-Logistics-Tracking-Platform
```

If working from the FleetFlow directory:

```bash
cd FleetFlow
```

---

## 2. Create Environment File

```powershell
Copy-Item .env.example .env
```

Update the environment variables as required.

---

## 3. Build Docker Containers

```bash
docker compose build
```

---

## 4. Start the Application

```bash
docker compose up -d
```

---

## 5. Check Services

```bash
docker compose ps
```

Expected services:

```text
backend
frontend
postgres
redis
celery-worker
celery-beat
```

---

# 🌐 Application URLs

### Frontend

```text
http://localhost:5173
```

### Backend

```text
http://localhost:8000
```

### Swagger API Documentation

```text
http://localhost:8000/docs
```

### OpenAPI Specification

```text
http://localhost:8000/openapi.json
```

---

# 🧪 Testing & QA

FleetFlow was tested across the major business workflows.

## Functional Workflow Testing

* [x] User authentication
* [x] Role-based authorization
* [x] Vehicle creation
* [x] Driver registration
* [x] Shipment creation
* [x] Trip creation
* [x] Driver assignment
* [x] Vehicle assignment
* [x] Fuel record creation
* [x] Maintenance scheduling
* [x] Maintenance alert generation
* [x] Trip completion

## Business Rule Testing

* [x] Vehicle under maintenance cannot be assigned
* [x] Driver on leave cannot be assigned
* [x] Driver with an active trip cannot receive another active trip
* [x] Invalid vehicle validation
* [x] Invalid driver validation
* [x] Duplicate maintenance alert prevention
* [x] Fuel record validation

## Dashboard Testing

* [x] Dashboard statistics
* [x] Vehicle statistics
* [x] Driver statistics
* [x] Shipment statistics
* [x] Trip statistics
* [x] Fuel analytics
* [x] Maintenance information

## Analytics Testing

* [x] Fuel analytics
* [x] Driver performance analytics
* [x] Maintenance reports

## Celery Testing

* [x] Celery worker execution
* [x] Celery Beat scheduling
* [x] Maintenance reminder execution
* [x] Automatic alert generation
* [x] Automatic notification generation
* [x] Duplicate alert prevention

---

# 🔍 Health & Troubleshooting

Check all Docker services:

```bash
docker compose ps
```

View backend logs:

```bash
docker compose logs --tail=100 backend
```

View Celery worker logs:

```bash
docker compose logs --tail=100 celery-worker
```

View Celery Beat logs:

```bash
docker compose logs --tail=100 celery-beat
```

Restart the complete application:

```bash
docker compose down
docker compose up -d
```

Rebuild containers after code or dependency changes:

```bash
docker compose down
docker compose build
docker compose up -d
```

---

# 📁 Project Structure

```text
FleetFlow/
│
├── Backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── tasks/
│   │   ├── utils/
│   │   ├── database.py
│   │   ├── main.py
│   │   └── celery_app.py
│   │
│   ├── Dockerfile
│   └── requirements.txt
│
├── Frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

# 🔒 Security

FleetFlow follows several security practices:

* JWT-based authentication
* Password hashing
* Role-based authorization
* Protected API routes
* Environment-based configuration
* Sensitive `.env` file excluded from Git
* API key placeholders stored in `.env.example`
* Backend validation using Pydantic
* Database-level relationships and constraints

---

# 📈 Future Enhancements

Potential future improvements include:

* Advanced predictive maintenance using machine learning
* Fuel consumption prediction
* Driver behavior prediction
* Automated route optimization
* Advanced GPS geofencing
* Email/SMS provider integration
* Mobile application for drivers
* Real-time fleet notifications
* Advanced BI dashboards
* Exportable PDF/Excel reports
* Vehicle document and insurance management
* Automated fleet cost forecasting

---

# 🎯 Project Objectives

FleetFlow was developed to demonstrate practical implementation of:

* Full-stack web development
* REST API development
* Database design
* Authentication and authorization
* Role-based access control
* Real-time WebSocket communication
* Background task processing
* Data analytics
* Business rule validation
* Docker containerization
* PostgreSQL integration
* React frontend development
* API testing and QA

---

# 💡 What This Project Demonstrates

This project demonstrates how a real-world logistics platform can combine:

```text
Frontend
   +
REST APIs
   +
Relational Database
   +
Authentication
   +
Real-Time Tracking
   +
Background Processing
   +
Analytics
   +
Business Rules
   +
Containerization
```

into a single integrated fleet management solution.

---

# 👨‍💻 Developer

**Dattatri Madakatte**

MCA Student | Python Full-Stack Developer

### Technologies

```text
Python
FastAPI
React
JavaScript
PostgreSQL
SQLAlchemy
Redis
Celery
Docker
Git
GitHub
REST APIs
WebSockets
```

---

# 📌 Project Status

**Status: Completed ✅**

FleetFlow has completed the planned development, integration, business-rule validation, analytics validation, Docker deployment setup, and QA testing.

---

# ⭐ Acknowledgements

This project was developed as part of the **Infosys Springboard 7.0 Internship** and focuses on applying full-stack development concepts to a practical fleet management and logistics use case.

---

## ⭐ If you find this project useful

Feel free to explore the repository, review the architecture, and provide feedback or suggestions for further improvements.
