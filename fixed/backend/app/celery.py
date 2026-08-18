"""
Task 4 requirement: Create celery.py
Export Celery application instance for FastAPI and Celery CLI.
"""
from app.celery_app import celery_app

__all__ = ["celery_app"]
