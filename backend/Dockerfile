# Backend Dockerfile for FleetFlow FastAPI Application
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*


# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and alembic migrations
COPY backend/ ./backend/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Create __init__.py if missing
RUN touch backend/__init__.py

# Expose FastAPI port
EXPOSE 8000

# Run database migrations then start the application
CMD ["sh", "-c", "alembic upgrade head && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"]
