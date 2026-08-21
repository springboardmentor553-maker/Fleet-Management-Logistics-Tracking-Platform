# 🚚 FleetFlow — Fleet Management & Logistics Tracking Platform

## Introduction

### What is FleetFlow?

**FleetFlow** is a full-stack, enterprise-grade **Fleet Management and Logistics Tracking Platform** built as part of the Infosys Internship Project. It provides a centralized, real-time system for managing an organization's fleet of vehicles, drivers, shipments, and logistics operations — all accessible through a modern, intuitive web interface.

The platform integrates multiple complex domains — GPS tracking, maintenance scheduling, fuel monitoring, driver attendance, and logistics dispatch — into a single unified product. It is secured with JWT-based authentication and enforces strict role-based access control across all operations.

---

## Problem Statement

Modern logistics and fleet operations suffer from critical operational inefficiencies:

| Challenge | Impact |
|---|---|
| **No Real-Time Visibility** | Fleet managers cannot track vehicle locations live, leading to delayed response times and poor customer communication |
| **Manual Dispatching** | Assigning shipments and drivers manually is error-prone, slow, and creates bottlenecks |
| **Reactive Maintenance** | Vehicles are serviced only after breakdowns, causing costly downtime and safety risks |
| **Fragmented Data** | Fuel records, driver logs, maintenance history, and delivery data are stored in silos (spreadsheets, paper logs) |
| **No Analytics** | Decision-makers lack data-driven insights on fleet performance, fuel efficiency, and delivery success rates |
| **Poor Driver Accountability** | There is no system to track attendance, safety scores, or trip history per driver |
| **No Alert System** | Critical events (overdue maintenance, delayed deliveries, low fuel) go unnoticed |

> **Core Problem:** Fleet operators have no single system that provides real-time visibility, intelligent dispatch, proactive alerts, and actionable analytics for their entire logistics operation.

---

## Objectives

FleetFlow was designed to solve these problems through the following primary objectives:

### 🎯 Primary Objectives

1. **Real-Time Vehicle Tracking**
   - Implement GPS-based live location tracking for every vehicle in the fleet
   - Use WebSockets to push location updates to the dashboard in real time
   - Simulate vehicle movement for demonstration and testing purposes

2. **Intelligent Dispatch Management**
   - Allow dispatchers to create shipments with origin, destination, and cargo weight
   - Enable automatic driver and vehicle assignment with conflict prevention
   - Track shipment status through the full lifecycle: `pending → in_transit → delivered / cancelled`

3. **Proactive Maintenance Management**
   - Schedule, track, and categorize maintenance records per vehicle
   - Auto-generate maintenance alerts (service due, overdue, health critical)
   - Track vehicle health scores and next service dates

4. **Fuel Consumption Monitoring**
   - Log every fueling event with quantity, cost, odometer reading, and station name
   - Generate fuel analytics: total consumed, average cost, highest/lowest usage per vehicle

5. **Driver Performance & Attendance**
   - Track attendance status (present, absent, on leave) per driver
   - Monitor safety scores, completed trips, total distance, and ratings
   - Provide per-driver shipment history and performance metrics

6. **Role-Based Access Control (RBAC)**
   - Enforce a 4-role hierarchy: Admin → Fleet Manager → Dispatcher → Driver
   - Each role sees only the features and data relevant to their function

7. **Reports & Analytics**
   - Export reports in PDF and Excel formats
   - Provide operational analytics: delivery success rates, average trip distance, delivery time
   - Dashboard with live KPIs: active vehicles, pending shipments, alerts, driver availability

8. **Notifications System**
   - Multi-channel notification support: push, email, SMS flags
   - Priority levels (low, normal, high, critical) with read/unread tracking
   - Broadcast notifications for system-wide alerts

---

## Tech Stack Overview

| Layer | Technology | Purpose |
|---|---|---|
| **Backend** | Python 3.13, FastAPI | REST API & WebSocket server |
| **Database** | PostgreSQL 16 | Primary relational data store |
| **ORM** | SQLAlchemy 2.0 | Database abstraction layer |
| **Migrations** | Alembic | Schema version control |
| **Auth** | JWT (python-jose), bcrypt | Secure authentication |
| **Async Tasks** | Celery + Redis | Background task processing |
| **Reports** | ReportLab, OpenPyXL | PDF & Excel export |
| **Frontend** | React 19, Vite 8 | Interactive SPA |
| **HTTP Client** | Axios | Frontend API communication |
| **Styling** | Vanilla CSS (dark theme) | Custom premium UI |
| **Containerization** | Docker, Docker Compose | Deployment & service orchestration |

---

## Scope

FleetFlow covers the following functional areas:

- ✅ User management with role-based access control
- ✅ Vehicle fleet CRUD with GPS coordinate tracking
- ✅ Driver management with performance metrics
- ✅ Shipment dispatch and assignment lifecycle
- ✅ Trip tracking with real-time WebSocket updates
- ✅ Maintenance scheduling, alerts, and health monitoring
- ✅ Fuel logging and analytics
- ✅ Driver attendance tracking
- ✅ Notifications with multi-channel support
- ✅ Reports export (PDF / Excel)
- ✅ Live map visualization
- ✅ Dashboard KPI cards with real-time stats

---

*Document Version: 1.0 | Project: FleetFlow | Organization: Infosys Internship*
