# FreightFlow Frontend — Fleet Operations Console

Original React implementation of the FreightFlow fleet management UI: a dark,
data-dense operations console styled after freight/transit signage (Space
Grotesk display type, IBM Plex Mono for data, a signal-amber accent, and a
departure-board style live KPI strip on the dashboard).

## Stack
React 18 · React Router 6 · Axios · Tailwind CSS · Vite

## Setup

```bash
cd freightflow-frontend
npm install
cp .env.example .env     # point VITE_API_BASE_URL at your backend
npm run dev
```

Runs at http://127.0.0.1:5173 — expects the FreightFlow backend at
`http://127.0.0.1:8000/api/v1` by default (see `../freightflow-backend`).

## Structure

```
src/
├── api/          per-module axios clients (vehicles, drivers, shipments, ...)
├── auth/         AuthContext (JWT session) + ProtectedRoute guard
├── components/   shared primitives: Card, Button, DataTable, StatusBadge, FormField
├── layout/       AppShell, Sidebar, Topbar
├── features/     one folder per business domain, each a self-contained page
└── router/       route table
```

## Roles
- `admin` — everything, plus `/users`
- `dispatcher` — fleet, drivers, shipments, routes, maintenance, tracking, reports
- `driver` — read access; tracking pings are typically pushed by a device/app
  using the same `/tracking/ping` endpoint, not this console
