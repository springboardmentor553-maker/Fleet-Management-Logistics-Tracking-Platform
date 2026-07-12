# Fleet Management & Logistics Tracking Platform

A backend-based Fleet Management and Logistics Tracking Platform developed using FastAPI, PostgreSQL, SQLAlchemy, and Alembic. This system helps manage vehicles, users, shipments, trips, fleet monitoring, and real-time tracking.


## Features

### Authentication & Authorization
- User Registration
- User Login
- Password Hashing using BCrypt
- JWT Authentication
- Role-Based Access Control
- Protected Routes

### User Roles
- Admin
- Fleet Manager
- Driver
- Dispatcher

### Vehicle Management
- Add Vehicle
- View Vehicles
- Update Vehicle
- Delete Vehicle

### Shipment Management
- Create Shipment
- View Shipments
- Update Shipment
- Delete Shipment

### Trip Management
- Schedule Trips
- Assign Vehicle & Driver
- Track Trip Status
- Update Delivery Status

### GPS Tracking
- Store Current Vehicle Location
- Store Destination Coordinates
- Simulate GPS Tracking

### Route Optimization
- Recommend Best Route
- Distance Estimation
- ETA Calculation
- Traffic-Aware Route Planning

### Dashboard
Provides an overview of:
- Total Vehicles
- Available Vehicles
- Vehicles On Trip
- Vehicles Under Maintenance
- Inactive Vehicles
- Total Shipments
- Total Trips
- Scheduled Trips
- Active Trips
- Completed Trips
- Delayed Trips

### Fleet Monitoring
- View Fleet Status
- Monitor Active Trips

### Real-Time Tracking
- WebSocket-based Live Vehicle Tracking
- Real-Time Location Updates

---

## Tech Stack

- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- JWT Authentication
- Passlib (BCrypt)
- Uvicorn
- WebSockets
- Swagger UI


## Project Structure

Fleet-Management-Logistics-Tracking-Platform/
│
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── utils/
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── alembic.ini
│
├── README.md
└── LICENSE


## Installation

### Clone the Repository

git clone <repository-url>
cd Fleet-Management-Logistics-Tracking-Platform

### Create Virtual Environment
python -m venv venv

### Activate Virtual Environment

Windows

venv\Scripts\activate

### Install Dependencies

pip install -r backend/requirements.txt


## Configure PostgreSQL

Update your database URL in:

backend/app/database.py

Example:

DATABASE_URL = "postgresql://username:password@localhost:5432/fleet_db"


## ▶Run Alembic Migrations


cd backend
python -m alembic upgrade head


## Run the Application

cd backend
python -m uvicorn app.main:app --reload

Server will run at:

http://127.0.0.1:8000

Swagger Documentation:

http://127.0.0.1:8000/docs

## API Modules

### Authentication
- Register User
- Login User

### Vehicles
- Add Vehicle
- Get Vehicles
- Update Vehicle
- Delete Vehicle

### Shipments
- Shipment CRUD

### Trips
- Trip CRUD
- Route Optimization
- ETA Calculation
- Delivery Status Update

### Dashboard
- Fleet Summary
- Shipment Summary
- Trip Summary

### Fleet Monitoring
- Fleet Status

### WebSocket
- Live Vehicle Tracking

## Testing

All APIs can be tested using:

- Swagger UI
- Postman

WebSocket testing can be performed using:

- Browser WebSocket Client
- Postman WebSocket
- Custom HTML Client

## Current Status

### Milestone 1 Completed
- Authentication
- Role-Based Access
- Vehicle Management
- Dashboard API

### Milestone 2 Completed
- Shipment Tracking
- Trip Scheduling
- GPS Tracking
- ETA Calculation
- Route Optimization
- Traffic-Aware Route Planning
- Delivery Status Monitoring
- Fleet Monitoring
- Dashboard Enhancements
- WebSocket Real-Time Tracking

## Developed By

Amisha Krishnan

MCA Student  
St. Aloysius (Deemed to be University), Mangalore

Backend Development using FastAPI & PostgreSQL.