# 📸 FleetFlow — Screenshots & UI Guide

## Application Screenshots

> The screenshots below document all major screens of the FleetFlow application.
> All interfaces use a dark fleet theme with a premium sidebar-based navigation layout.

---

## 1. Login Page

**Route:** `/` (before authentication)  
**Component:** `Login.jsx`  
**Access:** Public

**Features:**
- Email and password input fields
- JWT token returned on successful login
- Redirects to role-appropriate dashboard
- Dark-themed card design with FleetFlow branding

```
┌─────────────────────────────────────────┐
│                                         │
│            🚚 FleetFlow                 │
│       Fleet Management System           │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Email                            │  │
│  │  [___________________________]    │  │
│  │                                   │  │
│  │  Password                         │  │
│  │  [___________________________]    │  │
│  │                                   │  │
│  │  [         Login          ]       │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 2. Dashboard (Admin / Fleet Manager)

**Component:** `Dashboard.jsx`, `AdminDashboard.jsx`  
**Access:** All roles (role-specific views)

**KPI Cards displayed:**
| Stat Card | Color | Data Source |
|---|---|---|
| Total Vehicles | Blue | `/dashboard/stats` |
| Active Vehicles | Green | `/dashboard/stats` |
| Available Drivers | Teal | `/dashboard/stats` |
| Pending Shipments | Orange | `/dashboard/stats` |
| In-Transit Shipments | Purple | `/dashboard/stats` |
| Delivered Shipments | Emerald | `/dashboard/stats` |
| Active Alerts | Red | `/dashboard/stats` |

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Sidebar │  🚚 FleetFlow Dashboard                        │
│ ─────── │  ─────────────────────────────────────────── │
│ Dashboard│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ Vehicles │  │ 25   │ │ 18   │ │ 12   │ │  8   │        │
│ Drivers  │  │Total │ │Active│ │Avail.│ │Pending│        │
│ Shipments│  │Veh.  │ │Veh.  │ │Drvrs │ │Ships │        │
│ Live Map │  └──────┘ └──────┘ └──────┘ └──────┘        │
│ Trips    │                                               │
│ Maintnce │  ┌──────┐ ┌──────┐ ┌──────┐                 │
│ Fuel     │  │ 10   │ │ 125  │ │  4   │                 │
│ Notifs   │  │InTrns│ │Delivd│ │Alerts│                 │
│ Reports  │  └──────┘ └──────┘ └──────┘                 │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Live Map (GPS Tracking)

**Component:** `LiveMap.jsx` (27KB — largest component)  
**Access:** Admin, Fleet Manager, Dispatcher

**Features:**
- Real-time vehicle positions on interactive map
- WebSocket connection to `/gps/ws/locations`
- Color-coded markers by vehicle status:
  - 🟢 Green — Available
  - 🟡 Yellow — In Transit
  - 🔴 Red — Maintenance
- Vehicle info panel on marker click
- Auto-refresh every 2 seconds (simulation)

---

## 4. Vehicles Management

**Component:** `Vehicles.jsx`  
**Access:** Admin, Fleet Manager

**Features:**
- Paginated data table with all fleet vehicles
- Add Vehicle modal form
- Edit/Delete per-row actions
- Filter by status (Available / In Transit / Maintenance)
- Vehicle details: plate number, type, model, capacity, fuel type, GPS coordinates

**Table Columns:**
| # | Plate | Type | Model | Capacity | Fuel | Status | GPS | Actions |
|---|---|---|---|---|---|---|---|---|

---

## 5. Drivers Management

**Component:** `Drivers.jsx`  
**Access:** Admin, Fleet Manager, Dispatcher

**Features:**
- Driver cards with avatar initials
- Performance metrics: safety score, rating, trips count
- Attendance status badge (Present / Absent / On Leave)
- Add/Edit/Delete driver
- Filter by availability

---

## 6. Driver Assignment

**Component:** `DriverAssignment.jsx` (20KB)  
**Access:** Admin, Dispatcher

**Features:**
- View all assignments
- Assign available driver + vehicle to pending shipments
- Unassign / Reassign operations
- Conflict prevention (cannot assign unavailable resources)

---

## 7. Shipments Management

**Component:** `Shipments.jsx`  
**Access:** Admin, Dispatcher, Driver (own shipments)

**Features:**
- Create shipments with origin/destination/weight
- Status tracking with color-coded badges:
  - 🟡 Pending
  - 🔵 In Transit
  - 🟢 Delivered
  - 🔴 Cancelled
- Cancel shipment action
- Filter by status

---

## 8. Trips

**Component:** `Trips.jsx`  
**Access:** Admin, Fleet Manager, Dispatcher

**Features:**
- View all active/historical trips
- Trip status: Scheduled / Started / Completed / Cancelled
- Associated shipment, driver, vehicle information
- Timestamp tracking

---

## 9. Maintenance Records

**Component:** `Maintenance.jsx` (20KB)  
**Access:** Admin, Fleet Manager

**Features:**
- Schedule maintenance per vehicle
- Categories: Oil Change, Tire Replacement, Engine Service, Brake Service, General Inspection
- Health score tracking (0–100 gauge)
- Cost tracking and service provider info
- Status updates: Scheduled → In Progress → Completed

---

## 10. Maintenance Alerts

**Component:** `MaintenanceAlerts.jsx` (21KB)  
**Access:** Admin, Fleet Manager

**Features:**
- View all auto-generated and manual alerts
- Alert types:
  - 🔴 Overdue — Service not done
  - 🟠 Service Due — Upcoming service
  - 🟡 Health Critical — Health score < 50
  - 🔵 Upcoming — Reminder before due date
- Acknowledge and resolve alerts
- Filter by status (Pending / Sent / Completed)

---

## 11. Fuel Management

**Component:** `Fuel.jsx` (14KB)  
**Access:** Admin, Fleet Manager, Driver

**Features:**
- Log fuel entries with full details
- View fuel history per vehicle/driver
- Analytics panel: total consumed, avg cost, highest usage vehicle
- Date range filtering

---

## 12. Notifications Center

**Component:** `Notifications.jsx` (15KB)  
**Access:** All roles

**Features:**
- Inbox view with unread count badge
- Priority indicators (Low / Normal / High / Critical)
- Category icons (maintenance, delivery, assignment, system)
- Mark as read / Mark all as read
- Channel flags (Email / SMS / Push)
- Linked to reference entity (click to navigate)

---

## 13. Reports & Export

**Component:** `ReportsExport.jsx` (17KB)  
**Access:** Admin, Fleet Manager, Dispatcher

**Features:**
- 5 report types:
  1. Fleet Summary
  2. Driver Performance
  3. Fuel Consumption
  4. Maintenance History
  5. Shipment / Delivery Report
- Export formats: **PDF** and **Excel (.xlsx)**
- One-click download — file served directly from backend
- Preview stats before export

---

## 14. Role-Specific Dashboards

| Dashboard | Component | Visible to |
|---|---|---|
| Admin Dashboard | `AdminDashboard.jsx` | Admin |
| Fleet Manager | `FleetManagerDashboard.jsx` | Fleet Manager |
| Dispatcher | `DispatcherDashboard.jsx` | Dispatcher |
| Driver | `DriverDashboard.jsx` | Driver |

Each dashboard surfaces role-relevant KPIs and quick-action buttons.

---

## UI Design System

### Color Palette (Dark Theme)

| Element | CSS Variable / Color |
|---|---|
| Background | `#0d1117` (deep dark blue-black) |
| Sidebar | `#161b22` (dark navy) |
| Cards | `#21262d` (dark card surface) |
| Primary Accent | `#58a6ff` (blue) |
| Success | `#3fb950` (green) |
| Warning | `#d29922` (amber) |
| Danger | `#f85149` (red) |
| Text Primary | `#e6edf3` (near white) |
| Text Secondary | `#8b949e` (muted gray) |
| Border | `#30363d` (subtle border) |

### Typography
- **Font Family:** System font stack with Inter-like rendering
- **Headings:** Bold, larger weight
- **Labels:** Uppercase, letter-spaced, muted

### Component Patterns
- **Stat Cards** — Icon + number + label, colored left border
- **Data Tables** — Zebra striped, sortable headers, action columns
- **Modals** — Centered overlay with backdrop, form layout
- **Badges** — Pill-shaped status indicators with color coding
- **Sidebar** — Fixed left navigation with icon + label links

---

*Document Version: 1.0 | Project: FleetFlow | Organization: Infosys Internship*
