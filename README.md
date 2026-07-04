# Fleet Management & Logistics Tracking Platform

## Project Overview

The Fleet Management & Logistics Tracking Platform is a web application developed using FastAPI and PostgreSQL to manage fleet operations, drivers, vehicles, and shipments efficiently.

This project was developed as part of the Infosys Springboard Internship.

---

## Features

- User Registration
- User Login
- JWT Authentication
- Role-Based Access Control (Admin)
- Vehicle Registration (CRUD)
- Fleet Monitoring Dashboard
- PostgreSQL Database Integration
- SQLAlchemy ORM
- Alembic Database Migrations

---

## Technology Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Pydantic

### Authentication
- JWT (JSON Web Token)
- Passlib
- Python-JOSE

---

## Project Structure

backend/
│
├── alembic/
├── app/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   ├── utils/
│   ├── database.py
│   └── main.py
│
├── requirements.txt
└── alembic.ini

---

## Installation

### Clone the Repository

git clone - https://github.com/springboardmentor553-maker/Fleet-Management-Logistics-Tracking-Platform


### Navigate to Backend

cd backend

### Install Dependencies

pip install -r requirements.txt


### Configure PostgreSQL

Create a PostgreSQL database:

fleetflow_db

Update the database URL in:

app/database.py

---

## Run Alembic Migration

python -m alembic upgrade head

---

## Start the Server

python -m uvicorn app.main:app --reload

---

## API Documentation

Swagger UI

http://127.0.0.1:8000/docs

---

## Author

Amisha Krishnan

MCA Student

St. Aloysius (Deemed to be University)

Infosys Springboard Internship 2026