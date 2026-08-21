# 🚚 FleetFlow – Logistics & Fleet Management Platform

FleetFlow is a full-stack logistics and fleet management platform designed to help organizations manage their vehicles, drivers, shipments, trips, maintenance activities, fuel records, tracking information, alerts, and operational analytics from a centralized system.

The platform provides a web-based interface for managing fleet operations and monitoring logistics activities while using a RESTful backend API and PostgreSQL database.

---

## 📌 Project Overview

Managing logistics and fleet operations through spreadsheets, manual records, or disconnected systems can make it difficult to monitor vehicles, drivers, shipments, trips, maintenance, fuel usage, and delivery performance.

FleetFlow addresses this problem by providing a centralized digital platform where fleet-related information can be managed and monitored from a single application.

The system follows a modern full-stack architecture consisting of:

- React frontend
- FastAPI backend
- PostgreSQL database
- SQLAlchemy ORM
- Alembic database migrations
- JWT authentication
- Redis
- Celery background processing
- Docker and Docker Compose
- Leaflet / OpenStreetMap for map-based functionality

---

# 🎯 Problem Statement

Fleet and logistics organizations need to manage large amounts of operational information, including:

- Vehicles
- Drivers
- Shipments
- Trips
- Maintenance
- Fuel consumption
- Delivery status
- GPS/location information
- Operational performance

When these activities are handled using separate systems or manual processes, organizations may face:

- Data duplication
- Poor visibility
- Difficult tracking
- Delayed reporting
- Manual errors
- Difficulty monitoring fleet performance
- Difficulty identifying operational problems

FleetFlow provides a centralized system to improve visibility, organization, and management of fleet operations.

---

# 🎯 Objectives

The main objectives of FleetFlow are:

1. Centralize fleet and logistics information.
2. Manage vehicles and drivers efficiently.
3. Manage shipments and delivery information.
4. Schedule and monitor trips.
5. Track shipment and trip locations.
6. Maintain vehicle maintenance records.
7. Record and monitor fuel usage.
8. Provide operational analytics.
9. Provide alerts for important fleet activities.
10. Secure application access using JWT authentication.
11. Provide a scalable backend API.
12. Containerize the application using Docker.

---

# ✨ Key Features

## 🔐 Authentication

- User registration/login
- JWT-based authentication
- Protected API endpoints
- Authorization headers
- Secure password handling
- Role-based access support

---

## 🚗 Vehicle Management

FleetFlow provides functionality for managing fleet vehicles.

Features include:

- Add vehicles
- Update vehicle information
- View vehicle details
- Monitor vehicle status
- Manage vehicle-related operational information
- Associate vehicles with trips

---

## 👨‍✈️ Driver Management

The driver module provides centralized driver management.

Features include:

- Add drivers
- Update driver information
- View driver details
- Driver assignments
- Driver attendance management
- Associate drivers with trips

---

## 📦 Shipment Management

The shipment module manages logistics shipment information.

Features include:

- Create shipments
- Update shipments
- View shipment details
- Track shipment status
- Origin and destination information
- Sender information
- Receiver information
- Pickup date
- Delivery date
- Current shipment location

---

## 🛣️ Trip Management

Trips connect shipments, vehicles, and drivers.

Features include:

- Create trips
- Schedule trips
- Assign vehicles
- Assign drivers
- Associate shipments
- Departure time
- Expected arrival
- Actual arrival
- Trip status
- Trip distance
- Trip start coordinates
- Current location information

---

## 🔧 Maintenance Management

The maintenance module helps monitor vehicle maintenance activities.

Features include:

- Maintenance records
- Service dates
- Maintenance status
- Maintenance alerts
- Vehicle maintenance history

---

## ⛽ Fuel Management

The fuel module provides fleet fuel monitoring.

Features include:

- Fuel records
- Fuel usage information
- Fuel-related fleet data
- Fuel consumption monitoring

---

## 📊 Operational Analytics

FleetFlow provides operational insights through analytics.

Analytics can include:

- Total deliveries
- Successful deliveries
- Delayed deliveries
- Cancelled deliveries
- Trip-related statistics
- Shipment statistics
- Operational performance information

Charts and dashboards help users understand fleet performance.

---

## 🚨 Alerts

The system provides alerts for important fleet activities.

Examples include:

- Maintenance alerts
- Vehicle maintenance monitoring
- Operational notifications

---

## 📍 Location & Tracking

FleetFlow includes location-related functionality for logistics tracking.

Features include:

- GPS coordinates
- Trip start coordinates
- Current shipment location
- Map-based tracking
- Route calculation
- Location visualization

The frontend uses map functionality based on Leaflet/OpenStreetMap.

Where applicable, routing can use OSRM.

---

# 🏗️ System Architecture

FleetFlow follows a client-server architecture.

```text
                         ┌─────────────────────────┐
                         │       React Frontend    │
                         │                         │
                         │ Dashboard               │
                         │ Vehicles                │
                         │ Drivers                 │
                         │ Shipments               │
                         │ Trips                   │
                         │ Maintenance             │
                         │ Fuel                    │
                         │ Analytics               │
                         │ Tracking / Maps         │
                         └────────────┬────────────┘
                                      │
                                      │ HTTP / REST API
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     FastAPI Backend     │
                         │                         │
                         │ Authentication          │
                         │ Vehicle APIs             │
                         │ Driver APIs              │
                         │ Shipment APIs            │
                         │ Trip APIs                │
                         │ Maintenance APIs         │
                         │ Fuel APIs                │
                         │ Analytics APIs           │
                         │ Route APIs               │
                         └────────────┬────────────┘
                                      │
                     ┌────────────────┼────────────────┐
                     │                │                │
                     ▼                ▼                ▼
             ┌──────────────┐  ┌─────────────┐  ┌─────────────┐
             │ PostgreSQL   │  │    Redis    │  │   Celery    │
             │   Database   │  │ Cache/Broker │  │ Background  │
             │              │  │             │  │    Jobs     │
             └──────────────┘  └─────────────┘  └─────────────┘