# FleetFlow Backend

## Project Description
FleetFlow is a backend application built using FastAPI for fleet management.

## Technologies Used
- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL
- python-dotenv

## Installation

Create a virtual environment:

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
uvicorn app.main:app --reload
```

## API URL

http://127.0.0.1:8000

## Swagger Documentation

http://127.0.0.1:8000/docs