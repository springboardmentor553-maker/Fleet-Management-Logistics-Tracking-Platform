# FleetFlow

FleetFlow is a fleet management and logistics tracking platform designed to help teams organize vehicles, drivers, shipments, and delivery operations in one place. The project is currently centered on a lightweight FastAPI backend and is structured to grow into a full operations dashboard over time.

## What It Covers

- Managing fleets and vehicle records
- Tracking shipments and delivery status
- Coordinating drivers and assignments
- Supporting route planning and operational visibility
- Preparing for analytics, alerts, and reporting features

## Technology Snapshot

### Backend

- Python
- FastAPI

### Planned Frontend

- React.js

### Data Layer

- PostgreSQL

### Development Tools

- Git
- GitHub
- Docker
- VS Code
- Postman

## Repository Layout

```text
Fleet-Management-Logistics-Tracking-Platform/
│
├── app/
│   ├── main.py
│   ├── database.py
│   └── models.py
│
├── backend/
├── routers/
└── LICENSE
```

## Current Backend Status

At the moment, the backend exposes a simple FastAPI route at `/` that returns a success message. The database and model modules are placeholders for upcoming development.

## Run the Backend Locally

### 1. Clone the project

```bash
git clone https://github.com/springboardmentor553-maker/Fleet-Management-Logistics-Tracking-Platform.git
```

### 2. Open the project folder

```bash
cd Fleet-Management-Logistics-Tracking-Platform
```

### 3. Install the Python dependencies

If you already have a requirements file in your environment, install from it. Otherwise, install the core packages directly:

```bash
pip install fastapi uvicorn
```

### 4. Start the FastAPI server

```bash
python -m uvicorn app.main:app --reload
```

### 5. Visit the app

Open:

```text
http://127.0.0.1:8000
```

You should see a JSON response confirming that the FleetFlow backend is running.

## Next Steps

- Add database models and connection logic
- Build API routes for fleets, drivers, vehicles, and shipments
- Create the React frontend
- Add authentication, dashboards, and reports
