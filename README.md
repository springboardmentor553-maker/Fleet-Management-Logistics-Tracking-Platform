# FleetFlow – Logistics & Fleet Management Platform

## Project Overview

FleetFlow is a web-based logistics and fleet management platform designed to help organizations manage vehicles, drivers, shipments, trips, maintenance activities, fuel usage, and operational analytics from a centralized system.

The platform provides a unified interface for managing fleet operations, tracking shipments and trips, monitoring vehicle-related activities, and generating operational insights.

## Problem Statement

Managing fleet and logistics operations using separate systems or manual processes can make it difficult to track vehicles, drivers, shipments, trips, maintenance, fuel consumption, and operational performance.

FleetFlow aims to provide a centralized platform that integrates these activities into a single application, improving visibility, organization, and operational management.

---

# Features

## Authentication
- User authentication
- JWT-based authentication
- Protected application endpoints
- Role-based access support

## Fleet Management
- Vehicle management
- Vehicle information and status tracking
- Fleet operational data management

## Driver Management
- Driver management
- Driver assignments
- Driver attendance management

## Shipment Tracking
- Shipment creation and management
- Shipment status tracking
- Origin and destination information
- Sender and receiver information
- Current shipment location
- Pickup and delivery date information

## Trip Management
- Trip scheduling
- Trip and shipment association
- Departure and expected arrival information
- Actual arrival information
- Trip distance
- GPS-related trip information
- Trip start coordinates

## Maintenance Management
- Vehicle maintenance records
- Maintenance alerts
- Maintenance service dates
- Maintenance status monitoring

## Fuel Monitoring
- Fuel records
- Fuel-related fleet information
- Fuel consumption monitoring

## Operational Analytics
- Operational statistics
- Shipment and trip-related reports
- Delivery status analysis
- Operational reporting

## Alerts
- Maintenance alerts
- Vehicle-related maintenance monitoring

## Location & Tracking
- GPS-related tracking support
- Trip start coordinates
- Current location information for shipments
- Map-based tracking interface

---

# Technology Stack

### Frontend
- React
- JavaScript
- HTML
- CSS

### Backend
- Python
- FastAPI

### Database
- PostgreSQL

### ORM
- SQLAlchemy

### Database Migration
- Alembic

### Authentication
- JWT

### Background Processing
- Celery
- Redis

### Maps & Location
- Leaflet / OpenStreetMap
- OSRM where applicable

### Containerization
- Docker
- Docker Compose

---

# System Architecture

FleetFlow follows a client-server architecture.

```text
                    ┌──────────────────────┐
                    │      Frontend        │
                    │       React          │
                    └──────────┬───────────┘
                               │
                               │ HTTP / API
                               ▼
                    ┌──────────────────────┐
                    │       Backend        │
                    │       FastAPI        │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌────────────┐  ┌────────────┐  ┌────────────┐
        │ PostgreSQL │  │   Redis    │  │  Celery    │
        │  Database  │  │   Cache /  │  │ Background │
        │            │  │   Broker   │  │   Jobs     │
        └────────────┘  └────────────┘  └────────────┘