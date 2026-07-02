# FleetFlow – Fleet Management and Logistics Tracking Platform

FleetFlow is a Fleet Management and Logistics Tracking Platform developed to simplify fleet operations and logistics management. The system helps organizations manage vehicles, drivers, shipments, and transportation activities through a centralized platform. It is being developed using FastAPI for the backend and PostgreSQL for database management.

## Features

- User Authentication
- Fleet Management
- Shipment Tracking
- Route Management
- Driver Management
- Vehicle Maintenance
- Reports and Analytics
- REST API using FastAPI

## Technologies Used

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- Uvicorn

## Project Structure

```text
FleetFlow/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   └── requirements.txt
│
└── README.md
```

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Move to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the application:

```bash
python -m uvicorn app.main:app --reload
```

Open the application:

```
http://127.0.0.1:8000
```

API Documentation:

```
http://127.0.0.1:8000/docs
```

## Current Status

- FastAPI project initialized
- PostgreSQL database connected
- SQLAlchemy configured
- Alembic configured
- Requirements file created
- Project is under development
