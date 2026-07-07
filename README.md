# FleetFlow – Development Log

## Developer Information

- **Name:** Rohit
- **Branch:** rohit

---

# Development Log

## Day 1 – Project Setup (02 July 2026)

### Objectives

- Set up the local development environment.
- Configure Git and GitHub.
- Create the backend project structure.
- Run the FastAPI application successfully.

### Tasks Completed

- Cloned the project repository.
- Created and switched to the `rohit` branch.
- Created a Python virtual environment.
- Installed the required dependencies.
- Created the backend project structure.
- Configured the FastAPI application.
- Successfully ran the backend server using Uvicorn.

### Output

The application successfully returned the expected response at:

`http://127.0.0.1:8000`

#### Screenshot

![FastAPI Running](FleetFlow/images/day1-fastapi-running.png)

### Challenges Faced

- Resolved PowerShell execution policy issues.
- Fixed the project folder structure.
- Configured the correct Python interpreter.
- Recreated the virtual environment and installed project dependencies.

---

## Day 2 – Database & ORM Setup (07 July 2026)

### Objectives

- Configure PostgreSQL with FastAPI.
- Implement SQLAlchemy ORM models.
- Set up Alembic for database migrations.
- Generate and apply the initial database schema.

### Tasks Completed

- Installed and configured PostgreSQL.
- Created the `fleetflow_db` database.
- Connected FastAPI to PostgreSQL using SQLAlchemy.
- Configured environment variables using a `.env` file.
- Created SQLAlchemy models:
  - User
  - Driver
  - Vehicle
  - Shipment
- Initialized Alembic for database migrations.
- Configured Alembic to use the project environment configuration.
- Generated the initial migration.
- Applied the migration to create database tables.
- Verified successful database connectivity and schema synchronization.

### Output

Successfully created the following database tables:

- Users
- Drivers
- Vehicles
- Shipments

### Challenges Faced

- Resolved PostgreSQL connection issues caused by special characters in the database password.
- Configured Alembic to read the database URL directly from the `.env` file.
- Verified that database models and migrations remained synchronized after configuration changes.

### Next Steps

- Implement model relationships using SQLAlchemy.
- Develop authentication and authorization.
- Build CRUD APIs for Users, Drivers, Vehicles, and Shipments.