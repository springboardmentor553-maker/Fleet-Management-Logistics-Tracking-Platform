# FleetFlow - Fleet Management & Logistics Tracking Platform

## Project Overview
FleetFlow is a centralized platform for managing fleets, drivers, vehicles, and shipments. It helps organizations monitor fleet operations, track deliveries, optimize routes, and improve operational efficiency.

## Features
- User Management
- Fleet Management
- Shipment Tracking
- Route Optimization
- Vehicle Maintenance
- Driver Management
- Analytics Dashboard
- Notifications
- Reports

## Technology Stack

### Backend
- Python
- FastAPI

### Frontend
- React.js

### Database
- PostgreSQL

### Tools
- Git
- GitHub
- Docker
- VS Code
- Postman

## Project Structure

## Project Structure

```text
FleetFlow
│
├── backend
│   ├── app
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── config.py
│   │   └── routers/
│   ├── requirements.txt
│   └── venv/
│
├── frontend/
│
└── README.md
```
## Steps to Run Backend

### 1. Clone the Repository

```bash
git clone https://github.com/springboardmentor553-maker/Fleet-Management-Logistics-Tracking-Platform.git
```

### 2. Navigate to the Backend

```bash
cd Fleet-Management-Logistics-Tracking-Platform
cd backend
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Backend

```bash
python -m uvicorn app.main:app --reload
```

### 5. Open in Browser

Home:
http://127.0.0.1:8000

Swagger:
http://127.0.0.1:8000/docs