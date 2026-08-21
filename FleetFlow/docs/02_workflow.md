# 🔄 FleetFlow — Project Workflow

## System Workflow Overview

FleetFlow follows a layered, event-driven workflow from user authentication through to report generation. Below is the complete end-to-end operational workflow of the system.

---

## 1. Authentication & Authorization Flow

```
┌─────────────┐     POST /auth/login      ┌──────────────────┐
│   User      │ ─────────────────────────► │  Auth Router     │
│ (Browser)   │                            │  (FastAPI)       │
└─────────────┘                            └────────┬─────────┘
                                                    │
                                       Validate credentials
                                       (bcrypt hash compare)
                                                    │
                                           ┌────────▼─────────┐
                                           │  JWT Token       │
                                           │  Generated       │
                                           │  (30–480 min)    │
                                           └────────┬─────────┘
                                                    │
                              Token stored in sessionStorage (Frontend)
                                                    │
                              All subsequent requests carry:
                              Authorization: Bearer <token>
```

**Role-Based Routing (Frontend):**
After login, the user is redirected to their role-specific dashboard:

| Role | Landing Page |
|---|---|
| `admin` | Admin Dashboard → Full system access |
| `fleet_manager` | Fleet Manager Dashboard → Vehicles, Drivers |
| `dispatcher` | Dispatcher Dashboard → Shipments, Assignments |
| `driver` | Driver Dashboard → My Trips, Attendance |

---

## 2. Shipment Dispatch Lifecycle

This is the core operational workflow of the platform:

```
Dispatcher                    System                       Driver
    │                            │                            │
    │  Create Shipment           │                            │
    │ ─────────────────────────► │  status: "pending"         │
    │                            │                            │
    │  Assign Driver + Vehicle   │                            │
    │ ─────────────────────────► │  status: "in_transit"      │
    │                            │  Driver → unavailable      │
    │                            │  Vehicle → in_transit      │
    │                            │  Trip record created       │
    │                            │  Notification sent ──────► │
    │                            │                            │
    │                            │           Mark Delivered   │
    │                            │ ◄───────────────────────── │
    │                            │  status: "delivered"       │
    │                            │  Driver → available        │
    │                            │  Vehicle → available       │
    │                            │  delivered_at timestamped  │
    │                            │                            │
    │  (OR) Cancel Shipment      │                            │
    │ ─────────────────────────► │  status: "cancelled"       │
    │                            │  Resources freed           │
```

**Shipment Status State Machine:**
```
pending ──► in_transit ──► delivered
               │
               └──────────► cancelled
```

---

## 3. Real-Time GPS Tracking Workflow

```
Backend (Simulation)                WebSocket                 Frontend (LiveMap)
        │                               │                            │
        │  Simulation thread runs       │                            │
        │  every 2 seconds              │                            │
        │  Updates vehicle lat/lng ─────► Broadcast to all ─────────►│
        │  in database                  │  connected clients         │  Map updates
        │                               │                            │  in real-time
        │                               │                            │
        │  Driver manual update:        │                            │
        │  PATCH /gps/vehicles/{id}/    │                            │
        │  location ────────────────────► Broadcast ────────────────►│
```

**WebSocket Endpoints:**
- `/ws/tracking/{trip_id}` — Per-trip tracking socket
- `/gps/ws/locations` — All-vehicle live location feed

---

## 4. Maintenance & Alert Workflow

```
Fleet Manager                     System (Celery Beat)         Alert System
    │                                    │                           │
    │  Create Maintenance Record         │                           │
    │  (scheduled_date, category)        │                           │
    │ ──────────────────────────────►    │                           │
    │                                    │                           │
    │                           Periodic Task (every X days)        │
    │                                    │                           │
    │                           Checks: Is service overdue?         │
    │                           Checks: Is health score < 50?      │
    │                                    │                           │
    │                                    │  Auto-generate alert ─────►
    │                                    │  (service_due / overdue / │
    │                                    │   health_critical)        │
    │                                    │                           │
    │  View Alerts                       │                           │
    │ ◄─────────────────────────────────────────────────────────────│
    │  Acknowledge / Resolve alerts      │                           │
```

---

## 5. Fuel Management Workflow

```
Driver / Fleet Manager
    │
    │  Log Fuel Record
    │  POST /fuel/  (vehicle_id, driver_id, quantity, cost, odometer, station)
    │
    ▼
Database: fuel_records table
    │
    ├── GET /analytics/fuel
    │     └── Returns: total consumed, total cost, avg/vehicle, highest/lowest usage
    │
    └── GET /reports/export/fuel (PDF / Excel)
```

---

## 6. Reports Export Workflow

```
User Request                    Backend                        File Response
    │                               │                                │
    │  GET /reports/export/         │                                │
    │  {type}?format={pdf|xlsx}     │                                │
    │ ─────────────────────────────►│                                │
    │                               │  Query DB for data            │
    │                               │  Build report (ReportLab/     │
    │                               │  OpenPyXL)                    │
    │                               │  Stream file response ────────►│
    │                               │                                │
    │                          Browser downloads file               │
```

**Supported Report Types:**
| Report | Formats |
|---|---|
| Fleet Summary | PDF, Excel |
| Driver Performance | PDF, Excel |
| Fuel Consumption | PDF, Excel |
| Maintenance History | PDF, Excel |
| Shipment/Delivery Report | PDF, Excel |

---

## 7. Notification Workflow

```
System Event                    Notification Service              User
(Maintenance due,                       │                          │
 Shipment assigned,                     │                          │
 Delivery completed)                    │                          │
    │                                   │                          │
    │  Trigger Notification             │                          │
    │ ─────────────────────────────────►│                          │
    │                           Store in DB                        │
    │                           (priority, category, channel)      │
    │                                   │                          │
    │                           GET /notifications/ ──────────────►│
    │                           (Unread count badge)               │
    │                                   │                          │
    │                           PATCH /notifications/{id}/read ◄───│
```

---

## 8. Data Flow Architecture

```
                     ┌─────────────────────────────────────┐
                     │           REACT FRONTEND             │
                     │  (Vite, Axios, WebSocket client)     │
                     └──────────────────┬──────────────────┘
                                        │ HTTP / WebSocket
                     ┌──────────────────▼──────────────────┐
                     │         FASTAPI BACKEND              │
                     │  ┌─────────┐  ┌──────────────────┐  │
                     │  │ Routers │  │ Auth Middleware   │  │
                     │  │ (REST)  │  │ (JWT + RBAC)      │  │
                     │  └────┬────┘  └──────────────────┘  │
                     │       │                              │
                     │  ┌────▼────────────────────────┐    │
                     │  │    SQLAlchemy ORM            │    │
                     │  │    (Models + Relationships)  │    │
                     │  └────┬───────────────────────┘    │
                     └───────┼─────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
   ┌──────────▼───┐   ┌──────▼───┐  ┌──────▼──────┐
   │  PostgreSQL  │   │  Redis   │  │   Celery    │
   │  (Primary DB)│   │ (Broker) │  │  (Workers)  │
   └──────────────┘   └──────────┘  └─────────────┘
```

---

## 9. Background Task Workflow (Celery)

```
Celery Beat (Scheduler)
    │
    ├── maintenance_reminder_task
    │     Runs every: MAINTENANCE_REMINDER_DAYS (default 7)
    │     Action: Scans upcoming/overdue maintenance → creates alerts
    │
    └── [Future] GPS simulation, report generation, email dispatch
```

---

*Document Version: 1.0 | Project: FleetFlow | Organization: Infosys Internship*
